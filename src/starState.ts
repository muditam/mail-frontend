import type {MessageSummary} from './types'
export function withStar<T extends MessageSummary>(message:T,isStarred:boolean):T {
  const keywords={...message.keywords}
  if(isStarred)keywords['$flagged']=true;else delete keywords['$flagged']
  return {...message,keywords}
}
export function updateStarPages<T extends {pages:{messages:MessageSummary[]}[]}>(data:T|undefined,id:string,isStarred:boolean,starredOnly=false):T|undefined {
  if(!data)return data
  return {...data,pages:data.pages.map(page=>({...page,messages:page.messages.filter(m=>!(starredOnly&&!isStarred&&m.id===id)).map(m=>m.id===id?withStar(m,isStarred):m)}))}
}
