let http=require('node:http'), https=require('node:https')
let ab_map=[], str_map={__proto__:null}
for(let i=0;i<256;i++){
  ab_map[i]=String.fromCharCode(i);
  str_map[ab_map[i]]=i;
}
function str2ab(str) {
  const buf=new Uint8Array(str.length);
  for (let i=0;i<str.length;i++) buf[i]=str_map[str[i]];
  return buf;
}
function ab2str(buf) {
  let chars="";
  for(let i=0;i<buf.length;i++) chars+=ab_map[buf[i]];
  return chars;
}
async function bufferChunk(stream,maxLength=Infinity){
  return new Promise((resolve,reject)=>{
    var temp="" //adding text faster than Buffer.concat
    stream.on('data', function(chunk){
      if(temp.length+chunk.length>maxLength)
        return reject("data length exceeded");
      temp+=ab2str(chunk)
    })
    stream.on('end', function(){ resolve(str2ab(temp)) })
    stream.on('error', reject)
  })
}
async function requestURL(url,req,res,data=""){
  try{var {hostname,protocol,pathname,search}=new URL(url), {headers,method}=req}
  catch{return "INVALID URL"}
  if(headers.host) headers.host=hostname;
  return new Promise(resolve=>{
    let options={hostname, port:protocol==="https:"?443:80, path:pathname+search, method, headers}
    let request=(protocol==="https:"?https:http).request(options,async function respond(response){
      if(headers.origin) response.headers['Access-Control-Allow-Origin']=req.headers.origin;
      res.writeHead(response.statusCode,response.headers);
      resolve(  await bufferChunk(response)  );
    })
    request.on('error',function(error){ resolve(error.code||error.message||error) })
    request.write(data)
    request.end()
  })
}
http.createServer(async(req,res)=>{try{
  let url=req.url[0]==='/'?req.url.substr(1):req.url
  if(url.length<1) return res.end("pinged successfully");
  return res.end(await requestURL("https://"+url,req,res))
}catch(err){console.log(err)}}).listen(process.env.PORT||8080)