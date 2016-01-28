import Rx from 'rx'
import Cycle from '@cycle/core'
import { makeDOMDriver, div, button, p, h1 } from '@cycle/dom'
import electron from 'electron'

function ipcDriver(request$) {
    request$.subscribe(msg => {
        electron.ipcRenderer.send("load-data")
    })

    const ipc$ = Rx.Observable.create((observer) => {
        Rx.Observable
            .fromEvent(electron.ipcRenderer,
                       'dataLoaded',
                       (event, data) => data)
            .subscribe((data) => {
                observer.onNext(data)
            })

        // electron.ipcRenderer.on('dataLoaded', (event, data) => {
        //     console.log('get Data')
        // })
        return () => { console.log('disposed'); };
    })
    return ipc$;
}

// DOM read effect: Btn clicked
// IPC write effect: Send request
// IPC read effect: Get loaded data
// DOM write effect: Display data
// write effects are sinks
// read effects are coming from sources

function main(sources) {
    const clickEv$ = sources.DOM.select('button')
          .events('click')
    const request$ = clickEv$.map(() => {
        return { filename: 'default.custom.yaml' }
    })

    const data$ = sources.IPC.startWith(null);

    // setTimeout(() => electron.ipcRenderer.send("load-data"), 1000)
    return {
        DOM: data$.map(data =>
                 div([
                     h1('Menu'),
                     data === null ? p('Page Size: ') : p(`Page Size: ${!data ? '' : data.patch.menu.pageSize}`),
                     button("Load Data"),
                 ])
                ),
        IPC: request$,
    }
}

const drivers = {
    DOM: makeDOMDriver("#app"),
    IPC: ipcDriver,
}

Cycle.run(main, drivers);
