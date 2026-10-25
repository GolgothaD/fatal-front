# Builds all Fatal Front audio: music (Kevin MacLeod, CC BY 4.0), SFX (Kenney CC0 layered with original synthesis), announcer (Piper TTS, processed).
import numpy as np, soundfile as sf, pyloudnorm as pyln, subprocess, scipy.signal as ss, os, json
SR=48000; rng=np.random.default_rng(3); K='/tmp/k/'
def filt(x,kind,f,o=2): return ss.sosfilt(ss.butter(o,f,kind,fs=SR,output='sos'),x)
def tp(x): u=ss.resample_poly(x,4,1,axis=0); return 20*np.log10(np.max(np.abs(u))+1e-9)
def load(p):
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',p,'-ac','1','-ar',str(SR),'/tmp/a.wav'],check=True); x,_=sf.read('/tmp/a.wav'); return x
def ken(pack,f): return load(f'{K}kenney_{pack}/Audio/{f}.ogg')
def fade(x,i=32,o=400):
  x=x.copy(); x[:i]*=np.linspace(0,1,i); o=min(o,len(x)); x[-o:]*=np.linspace(1,0,o)**2; return x
def mix(*parts):
  n=max(len(p)+int(d*SR) for p,d,g in parts); y=np.zeros(n)
  for p,d,g in parts: s=int(d*SR); y[s:s+len(p)]+=p*g
  return y
def pitch(x,semi):  # resample (changes length, arcade-style)
  r=2**(semi/12); n=int(len(x)/r); return np.interp(np.arange(n)*r,np.arange(len(x)),x)
def trim(x,th=0.003):
  i=np.where(np.abs(x)>th*np.max(np.abs(x)))[0]; return x[max(0,i[0]-48):i[-1]+1] if len(i) else x
def limit(x,ceil=-3.2):
  c=10**(ceil/20); p=tp(x)
  if p>ceil: x=np.tanh(x/c*0.9)*c/np.tanh(0.9) if False else x*(c/10**(p/20))
  return x
meter=pyln.Meter(SR,block_size=0.1)
def lufs(x):
  xx=x if len(x)>=SR else np.concatenate([x,np.zeros(SR-len(x)+10)])
  # short sounds: measure loudness of the active part (momentary-style) so short hits are comparable
  return meter.integrated_loudness(xx) if len(x)>=SR*0.4 else 10*np.log10(np.mean(x**2)+1e-12)-0.691+3
REPORT={}
def save(name,x,target,folder='sfx',br='80k'):
  x=np.asarray(x,float); x=x*10**((target-lufs(x))/20)
  # soft knee: tame any peaks above -3.2 dBTP
  p=tp(x)
  if p>-3.2:
    c=10**(-3.4/20); x=np.where(np.abs(x)>c*0.7, np.sign(x)*(c*0.7+(c*0.3)*np.tanh((np.abs(x)-c*0.7)/(c*0.3))), x)
    p=tp(x)
    if p>-3.1: x*=10**((-3.2-p)/20)
  sf.write('/tmp/o.wav',x.astype(np.float32),SR)
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/o.wav','-c:a','libopus','-b:a',br,f'audio/{folder}/{name}.ogg'],check=True)
  REPORT[name]=(round(lufs(x),1),round(tp(x),1)); print(name,REPORT[name])
def noise(n): return rng.standard_normal(n)
def env(n,a,d): t=np.arange(n)/SR; return (1-np.exp(-t/max(a,1e-4)))*np.exp(-t/d)
def thump(f0,f1,dur,d):
  n=int(dur*SR); t=np.arange(n)/SR; f=f1+(f0-f1)*np.exp(-t/0.03); return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.001,d)
def verb(x,t=0.35,mixv=0.18):
  n=int(t*SR); ir=noise(n)*np.exp(-np.arange(n)/SR/(t/5)); ir=filt(ir,'low',5000); ir/=np.sqrt(np.sum(ir**2))
  y=ss.fftconvolve(x,ir); xx=np.concatenate([x,np.zeros(len(y)-len(x))]); return fade(xx+mixv*y,8,int(SR*0.05))
def gunshot(body=180,crack=2600,dec=0.07,tail=0.18):
  n=int(0.45*SR); nz=noise(n)
  c=filt(nz,'band',[crack*0.5,min(crack*2,15000)])*env(n,0.0005,0.012)
  b=filt(nz,'low',body*4)*env(n,0.001,dec)*2.2
  t=thump(body*2.2,body*0.6,0.45,dec)*1.4
  tl=filt(nz,'band',[300,2200])*env(n,0.01,tail)*0.25
  return filt(c*0.8+b+t+tl,'low',9000)
if __name__=='__main__':
  os.makedirs('audio/sfx',exist_ok=True)
  # ---------- weapons ----------
  save('gun',  verb(mix((gunshot(),0,1),(ken('impact-sounds','impactMetal_light_001')[:9000],0,0.25)),0.25,0.12),-20)
  save('spread',verb(mix((gunshot(220,3200,0.05),0,1),(pitch(ken('sci-fi-sounds','laserSmall_000'),-5),0,0.5)),0.3,0.15),-20)
  save('laser',verb(filt(pitch(ken('sci-fi-sounds','laserLarge_001'),-3),'low',7000),0.4,0.2),-20)
  fl=ken('sci-fi-sounds','thrusterFire_001'); save('flame',fade(filt(fl[:int(0.5*SR)],'low',6000),300,6000),-21)
  save('shotgun',verb(mix((gunshot(120,1800,0.12,0.3),0,1.2),(ken('impact-sounds','impactMetal_heavy_000')[:12000],0.02,0.2)),0.5,0.2),-19)
  save('eshot',filt(pitch(ken('sci-fi-sounds','laserRetro_002'),-4),'low',5000),-23)
  save('turret',mix((gunshot(140,2000,0.06),0,1),(filt(pitch(ken('sci-fi-sounds','laserRetro_000'),-7),'low',4000),0,0.6)),-22)
  # ---------- impacts & explosions ----------
  save('hitm',fade(filt(ken('impact-sounds','impactMetal_light_002'),'low',6000)),-23)
  save('hitf',fade(mix((ken('impact-sounds','impactPunch_medium_001'),0,1),(ken('sci-fi-sounds','slime_000')[:9000],0,0.35))),-22)
  ex=mix((ken('sci-fi-sounds','explosionCrunch_000'),0,1),(ken('sci-fi-sounds','lowFrequency_explosion_000'),0,1.1),(thump(90,35,1.2,0.35),0,1.2))
  save('boom',verb(filt(ex,'low',8000),0.8,0.2),-19)
  ex2=mix((ken('sci-fi-sounds','explosionCrunch_003'),0,1),(ken('sci-fi-sounds','lowFrequency_explosion_001'),0,1.2),(ken('sci-fi-sounds','explosionCrunch_001'),0.18,0.8),(thump(70,28,2,0.6),0,1.4))
  save('bigboom',verb(filt(ex2,'low',7500),1.2,0.25),-18.5)
  save('smallboom',filt(pitch(ken('sci-fi-sounds','explosionCrunch_002'),2),'low',7000),-21)
  # ---------- fighting ----------
  def whoosh(d=0.18,f0=500,f1=2500):
    n=int(d*SR); x=noise(n); t=np.linspace(0,1,n); y=np.zeros(n)
    for i in range(0,n,256): f=f0+(f1-f0)*np.sin(np.pi*t[i])**2; seg=x[i:i+256]; y[i:i+256]=seg
    y=filt(y,'band',[f0,f1])*np.sin(np.pi*t)**2; return y
  save('swing',whoosh(),-25)
  save('swingh',whoosh(0.26,300,1800),-24)
  for i in range(3): save(f'punch{i}',verb(mix((ken('impact-sounds',f'impactPunch_medium_00{i}'),0,1),(thump(160,70,0.2,0.04),0,0.6)),0.2,0.1),-20)
  for i in range(2): save(f'kick{i}',verb(mix((ken('impact-sounds',f'impactPunch_heavy_00{i}'),0,1),(thump(120,50,0.3,0.06),0,0.8)),0.25,0.12),-19.5)
  save('upper',verb(mix((whoosh(0.2,400,2200),0,0.6),(ken('impact-sounds','impactPunch_heavy_003'),0.08,1.2),(thump(100,40,0.5,0.12),0.08,1)),0.6,0.2),-19)
  save('block',fade(filt(mix((ken('impact-sounds','impactPlate_medium_001'),0,1),(ken('impact-sounds','impactSoft_medium_000'),0,0.6)),'low',5000)),-22)
  save('splat',fade(filt(mix((ken('sci-fi-sounds','slime_001'),0,1),(ken('impact-sounds','impactSoft_heavy_001'),0,0.7)),'low',6000)),-22)
  save('hurt',fade(mix((ken('impact-sounds','impactSoft_heavy_002'),0,1),(thump(140,60,0.3,0.08),0,0.6))),-21)
  save('fall',verb(mix((ken('impact-sounds','impactSoft_heavy_000'),0,1),(ken('impact-sounds','impactWood_heavy_001'),0.04,0.4),(thump(80,35,0.6,0.15),0,1)),0.5,0.15),-20)
  save('jump',filt(whoosh(0.14,250,1200),'low',3000),-27)
  save('land',fade(ken('impact-sounds','footstep_concrete_002')),-25)
  # specials
  save('sp_fire',verb(mix((filt(ken('sci-fi-sounds','thrusterFire_002')[:int(.7*SR)],'low',6000),0,1),(pitch(ken('sci-fi-sounds','forceField_000'),-7),0,0.7),(thump(110,50,0.6,0.2),0,0.6)),0.6,0.2),-19.5)
  save('sp_charge',verb(mix((pitch(ken('sci-fi-sounds','engineCircular_000'),-3)[:int(.6*SR)],0,1),(whoosh(0.4,200,1500),0.1,0.8)),0.5,0.2),-20)
  save('sp_shock',verb(filt(mix((pitch(ken('sci-fi-sounds','forceField_003'),-2),0,1),(ken('sci-fi-sounds','computerNoise_001')[:int(.4*SR)],0,0.3)),'low',7000),0.5,0.2),-20)
  save('sp_teleport',verb(filt(pitch(ken('sci-fi-sounds','forceField_004'),-9),'low',5000),0.6,0.25),-21)
  save('grenade',fade(filt(ken('impact-sounds','impactMetal_medium_001'),'low',5000)),-23)
  # pickups / UI: warm, no shrill dings (everything low-passed under 5 kHz)
  save('pickup',verb(filt(mix((pitch(ken('sci-fi-sounds','forceField_002'),-4),0,1),(ken('sci-fi-sounds','computerNoise_000')[:6000],0,0.15)),'low',4500),0.5,0.2),-21)
  save('ui',fade(filt(ken('impact-sounds','impactGeneric_light_001'),'low',4000)),-26)
  save('uisel',verb(fade(filt(mix((ken('impact-sounds','impactMetal_light_000'),0,0.6),(thump(200,90,0.3,0.06),0,1)),'low',4000)),0.3,0.15),-23)
  save('coin',verb(filt(mix((ken('impact-sounds','impactMetal_medium_003'),0,0.7),(pitch(ken('sci-fi-sounds','forceField_001'),-5)[:int(.5*SR)],0,0.6)),'low',4500),0.5,0.2),-21)
  save('stamp',verb(mix((thump(70,30,1,0.3),0,1.5),(ken('impact-sounds','impactPlate_heavy_000'),0,0.6),(ken('impact-sounds','impactBell_heavy_001'),0,0.25)),1.2,0.25),-19)
  save('alarm',filt(pitch(ken('sci-fi-sounds','spaceEngineLow_001')[:int(1.2*SR)],3),'low',3000),-22)
  json.dump(REPORT,open('/tmp/sfxreport.json','w'))
