# Announcer (Piper TTS -> arcade processing) and music (Kevin MacLeod, CC BY 4.0) mastering
import sys; sys.argv=['x']
from tools_audio import *
LINES={'title':'Fatal Front!','round1':'Round one.','round2':'Round two.','round3':'Final round.','fight':'Fight!','endit':'End it!',
 'strike':'Fatal strike!','perfect':'Perfect!','youwin':'You win.','youlose':'You lose.','stage':'Stage clear!','go':'Move out!',
 'spread':'Spread gun!','laser':'Laser!','flame':'Flame thrower!','rapid':'Rapid fire!','life':'One up!','continue':'Continue?','gameover':'Game over.',
 'choose':'Choose your fighter!','warning':'Warning!','excellent':'Excellent!','brutal':'Brutal!','raze':'Raze!','brick':'Brick!','nova':'Nova!','kazan':'Kazan!',
 'wins':'Wins.','boss':'Here comes a challenger!','final':'Face the Iron Khan!','victory':'Victory is yours.'}
def tts(text,model='/tmp/en_US-ryan-medium.onnx',ls=1.05):
  subprocess.run(['piper','-m',model,'--length_scale',str(ls),'-f','/tmp/v.wav'],input=text.encode(),check=True,capture_output=True)
  return load('/tmp/v.wav')
def arcade(x):
  x=trim(x); x=pitch(x,-3.5)                      # deeper, bigger
  x=filt(x,'high',90); x=x/np.max(np.abs(x))
  x=np.tanh(x*2.6)/np.tanh(2.6)                    # cabinet-amp drive
  q=2**10; x=np.round(x*q)/q                        # light 10-bit grit
  x=filt(x,'low',7000)+0.35*filt(x,'band',[1800,3500])  # presence
  # doubled slap + hall
  d=int(0.028*SR); y=x.copy(); y[d:]+=0.35*x[:-d]
  return verb(y,1.4,0.28)
if 'vo' in os.environ.get('DO','vo music'):
  for k,t in LINES.items():
    save(k,arcade(tts(t,ls=1.15 if len(t)<10 else 1.05)),-17,'vo','64k')
MUS={'title':('Clash_Defiant',0,150),'s1':('Volatile_Reaction',0,160),'s2':('Movement_Proposition',0,170),'s3':('Exhilarate',0,160),
 's4':('Ouroboros',0,170),'s5':('Hitman',0,170),'s6':('Rocket',0,160),'fight':('Killers',0,180),'final':('Unholy_Knight',0,170)}
if 'music' in os.environ.get('DO','vo music'):
  for k,(f,a,b) in MUS.items():
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'src_audio/{f}.mp3','-ar',str(SR),'/tmp/m.wav'],check=True)
    x,_=sf.read('/tmp/m.wav'); x=x[int(a*SR):int(b*SR)]
    xf=int(3*SR); t=np.linspace(0,1,xf)[:,None]; y=x[:-xf].copy(); y[:xf]=y[:xf]*np.sqrt(t)+x[-xf:]*np.sqrt(1-t)  # seamless loop
    l=pyln.Meter(SR).integrated_loudness(y); y=y*10**((-16-l)/20); p=tp(y.max(axis=1) if False else y[:,0]); p=max(tp(y[:,0]),tp(y[:,1]))
    if p>-4.6: c=10**(-4.8/20); y=np.where(np.abs(y)>c*0.75,np.sign(y)*(c*0.75+c*0.25*np.tanh((np.abs(y)-c*0.75)/(c*0.25))),y)
    sf.write('/tmp/o.wav',y.astype(np.float32),SR)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/o.wav','-c:a','libopus','-b:a','72k','audio/music/'+k+'.ogg'],check=True)
    print(k,round(pyln.Meter(SR).integrated_loudness(y),1),round(max(tp(y[:,0]),tp(y[:,1])),1),round(len(y)/SR))
