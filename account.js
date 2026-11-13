export async function setupAccount({readPreference,writePreference,onRemote}) {
 const $=s=>document.querySelector(s),dialog=$('#auth-dialog'),state=$('#auth-state'),form=$('#auth-form'),account=$('#account'),signout=$('#sign-out');
 let client,user,applying=false,ready=false,timer,queue=Promise.resolve();
 account.addEventListener('click',()=>dialog.showModal());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
 if(!url||!key){state.textContent='Sign-in is not connected yet. Your shortlist and progress still work in this browser.';form.hidden=true;return;}
 try{const {createClient}=await import('@supabase/supabase-js');client=createClient(url,key);}
 catch{state.textContent='Sign-in could not load. Try refreshing. Your browser plan is still available.';form.hidden=true;return;}
 const local=()=>({saved:readPreference('aa-saved-programs',[]),plans:readPreference('aa-application-plans',{})});
 async function push(snapshot=local()) {
  if(!user||!ready)return;
  const id=user.id;
  const {error}=await client.from('student_plans').upsert({user_id:id,saved:snapshot.saved,plans:snapshot.plans,updated_at:new Date().toISOString()});
  if(user?.id!==id)return;
  state.textContent=error?'Sync unavailable. Your browser plan is safe. Try signing in again.':'Signed in · Your shortlist and progress are synced.';
 }
 async function connect(session) {
  ready=false;user=session?.user;
  account.textContent=user?'My account':'Sign in';form.hidden=Boolean(user);signout.hidden=!user;
  if(!user){state.textContent='Get a secure sign-in link. No password needed.';return;}
  state.textContent='Loading your saved journey…';
  const id=user.id;
  const {data,error}=await client.from('student_plans').select('saved,plans').eq('user_id',id).maybeSingle();
  if(user?.id!==id)return;
  if(error){state.textContent='Signed in, but sync is unavailable. Ask the team to finish the database setup. Your browser plan is safe.';return;}
  const owner=readPreference('aa-plan-owner',null);
  const current=owner&&owner!==id?{saved:[],plans:{}}:local();
  const saved=[...new Set([...(Array.isArray(data?.saved)?data.saved:[]),...current.saved])];
  const plans={...(data?.plans??{}),...current.plans};
  applying=true;writePreference('aa-plan-owner',id);writePreference('aa-saved-programs',saved);writePreference('aa-application-plans',plans);onRemote({saved,plans});applying=false;ready=true;
  await push({saved,plans});
 }
 client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION'].includes(event))setTimeout(()=>{queue=queue.then(()=>connect(session));},0);});
 window.addEventListener('aa-local-change',()=>{if(applying||!ready)return;clearTimeout(timer);timer=setTimeout(()=>{queue=queue.then(()=>push());},400);});
 window.addEventListener('storage',e=>{if(['aa-saved-programs','aa-application-plans'].includes(e.key)){onRemote(local());if(ready)push();}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('button');button.disabled=true;state.textContent='Sending your sign-in link…';
  try{const {error}=await client.auth.signInWithOtp({email:$('#auth-email').value.trim(),options:{emailRedirectTo:location.origin+location.pathname+'#planner'}});state.textContent=error?'Could not send a sign-in link. Try again shortly.':'Check your email for a secure sign-in link. You can keep browsing.';}
  catch{state.textContent='Sign-in service could not connect. Try again shortly.';}finally{button.disabled=false;}
 });
 signout.addEventListener('click',async()=>{
  clearTimeout(timer);await queue;await push();await client.auth.signOut();
  applying=true;writePreference('aa-saved-programs',[]);writePreference('aa-application-plans',{});writePreference('aa-plan-owner',null);onRemote({saved:[],plans:{}});applying=false;
  state.textContent='Signed out. Your synced plan is kept securely in your account.';
 });
}
