export const dynamic = 'force-static'

export function GET(): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.sendora.io'

  const js = `(function(){
  var s=document.currentScript;
  if(!s)return;
  var id=s.getAttribute('data-domain-id');
  if(!id)return;
  var f=document.createElement('iframe');
  f.src='${appUrl}/chatbot/'+encodeURIComponent(id);
  f.style.cssText='position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:100;background:transparent;';
  f.setAttribute('allow','microphone');
  f.setAttribute('title','Sendora Chatbot');
  document.body.appendChild(f);
})();`

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
