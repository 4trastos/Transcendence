type Observer = ()=>void;

export function reactive<T extends object>(obj: T): [T, {
  subscribe: (observer: Observer) => void,
  clearObservers:()=>void,
  pause: () => void;
  resume: () => void;
  }] {
  const observers = new Set<Observer>();
  let paused = false;

  const proxy = new Proxy(obj, {
	set(target, prop, value) {
	  const changed = target[prop as keyof T] !== value;
	  target[prop as keyof T] = value;
	  if (changed && !paused){
		observers.forEach(cb => cb());
	  }
	  return true;
	}
  });
  const subscribe = (fn: Observer) => observers.add(fn);
  const clearObservers = () =>{
	observers.clear();
  }
	   

  return [proxy, {
	subscribe,
	clearObservers,
	pause: () => { paused = true; },
	 resume: () => { paused = false; },
	}
  ];
}


