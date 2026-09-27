from __future__ import annotations
import json, math, shutil, subprocess
from pathlib import Path
from .dsp import read_wav, resample

class MediaError(RuntimeError): pass

def need(name):
    p=shutil.which(name)
    if not p: raise MediaError(f'{name} is required')
    return p

def run(cmd):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if p.returncode: raise MediaError(p.stderr[-4000:])
    return p.stdout

def probe(path):
    out=run([need('ffprobe'),'-v','error','-show_entries','format=duration,size:stream=index,codec_type,codec_name,width,height,sample_rate,channels','-of','json',str(path)])
    data=json.loads(out); fmt=data.get('format',{}); streams=data.get('streams',[])
    return {'duration_s':round(float(fmt.get('duration') or 0),6),'size':int(fmt.get('size') or Path(path).stat().st_size),'streams':streams}

def normalize_audio(src,dst):
    Path(dst).parent.mkdir(parents=True,exist_ok=True)
    run([need('ffmpeg'),'-y','-v','error','-i',str(src),'-vn','-ar','48000','-ac','2','-c:a','pcm_s16le',str(dst)])
    return probe(dst)

def extract_audio(src,dst): return normalize_audio(src,dst)

def export_format(src, dst, kind):
    kind = (kind or '').lower()
    if kind not in ('wav', 'mp3', 'mp4'):
        raise MediaError('format must be wav, mp3, or mp4')
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    src = Path(src)
    if kind == 'wav':
        if src.suffix.lower() == '.wav':
            if Path(dst).resolve() != src.resolve():
                Path(dst).write_bytes(src.read_bytes())
            return probe(dst)
        run([need('ffmpeg'),'-y','-v','error','-i',str(src),'-vn','-ar','48000','-ac','2','-c:a','pcm_s16le',str(dst)])
        return probe(dst)
    if kind == 'mp3':
        run([need('ffmpeg'),'-y','-v','error','-i',str(src),'-vn','-ar','48000','-ac','2','-c:a','libmp3lame','-b:a','192k',str(dst)])
        return probe(dst)
    info = probe(src)
    has_video = any(s.get('codec_type') == 'video' for s in info.get('streams') or [])
    if has_video:
        run([need('ffmpeg'),'-y','-v','error','-i',str(src),'-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(dst)])
        return probe(dst)
    run([
        need('ffmpeg'),'-y','-v','error',
        '-f','lavfi','-i','color=c=0x07080c:s=1080x1080:r=30',
        '-i',str(src),
        '-shortest','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
        '-c:a','aac','-b:a','192k','-movflags','+faststart',str(dst)
    ])
    return probe(dst)

def render_video(video,audio,out,start_s=0,end_s=None,width=None,height=None):
    cmd=[need('ffmpeg'),'-y','-v','error']
    if start_s and float(start_s)>0: cmd += ['-ss',f'{float(start_s):.3f}']
    cmd += ['-i',str(video),'-i',str(audio)]
    if end_s is not None and float(end_s)>float(end_s if False else end_s):
        cmd += ['-t',f'{float(end_s)-float(start_s):.3f}']
    vf=[]
    if width and height: vf.append(f'scale={int(width)}:{int(height)}:force_original_aspect_ratio=decrease,pad={int(width)}:{int(height)}:(ow-iw)/2:(oh-ih)/2')
    if vf: cmd += ['-vf',','.join(vf)]
    cmd += ['-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',str(out)]
    Path(out).parent.mkdir(parents=True,exist_ok=True); run(cmd); return probe(out)

def _env(path, rate=100):
    sr,fr=read_wav(path); fr=resample(fr,sr,48000); hop=max(1,48000//rate); vals=[]
    for i in range(0,len(fr),hop):
        c=fr[i:i+hop]; vals.append(sum(max(abs(l),abs(r)) for l,r in c)/max(1,len(c)))
    mean=sum(vals)/max(1,len(vals)); vals=[v-mean for v in vals]
    norm=math.sqrt(sum(v*v for v in vals)) or 1.0
    return [v/norm for v in vals]

def sync_offset(reference_wav, video_wav, max_shift_s=10):
    a=_env(reference_wav); b=_env(video_wav); rate=100; maxs=min(int(max_shift_s*rate),max(len(a),len(b)))
    best=(float('-inf'),0)
    for shift in range(-maxs,maxs+1):
        s=0.0; n=0
        lo=max(0,-shift); hi=min(len(a),len(b)-shift)
        if hi-lo<50: continue
        for i in range(lo,hi): s+=a[i]*b[i+shift]; n+=1
        score=s/max(1,n)
        if score>best[0]: best=(score,shift)
    return {'offset_ms':int(round(best[1]*1000/rate)),'correlation':round(best[0],8),'method':'deterministic-envelope-cross-correlation','sample_hz':rate}
