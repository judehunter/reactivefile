export function makeReactive(obj: Record<string, any>, key: string, notify: (obj: Record<string, any>)=>any) {
  let val = obj[key]

  Object.defineProperty(obj, key, {
    get() {
      return val
    },
    set(newVal) {
      val = newVal
      notify(obj)
    }
  })
}

export function observeData(obj: Record<string, any>, deep: boolean, notify: (obj: Record<string, any>) => any) {
  if (!(typeof obj === 'object' && obj !== null)) return;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (deep) observeData(obj[key], true, notify);
      makeReactive(obj, key, notify);
    }
  }
}