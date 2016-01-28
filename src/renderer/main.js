import Rx from 'rx'
import Cycle from '@cycle/core'
import { makeDOMDriver, div, button, p, h1 } from '@cycle/dom'
import electron from 'electron'

function ipcDriver(request$) {
    request$.subscribe(req => electron.ipcRenderer.send(req.msg, req.payload))

    const ipc$ = Rx.Observable.create(observer => {
        Rx.Observable
            .fromEvent(electron.ipcRenderer,
                       'ipc-driver-finished',
                       (event, data) => data)
            .subscribe(data => observer.onNext(data))

        return () => { console.log('disposed') }
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
          .startWith({/* Fake a click event for initial loading*/})
    const request$ = clickEv$.map(() => {
        return {
            msg: 'load-data',
            payload: { filename: 'default.custom.yaml' }
        }
    })
    const data$ = sources.IPC;

    return {
        DOM: data$.map(data =>
                 div([
                     h1('Menu'),
                     p(`Page Size: ${data.patch.menu.pageSize}`),
                     h1('Schema List'),
                     data.patch.schemaList.map(({schema}) => p(schema)),
                     button("Reload Data"),
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
