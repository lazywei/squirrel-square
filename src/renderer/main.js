import Rx from 'rx'
import Cycle from '@cycle/core'
import { makeDOMDriver, div, input, p, h1 } from '@cycle/dom'
import electron from 'electron'

function ipcDriver(request$) {
    const ipc$ = Rx.Observable.create((observer) => {
        electron.ipcRenderer.on('dataLoaded', (event, data) => {
            observer.onNext(data)
        });
        return () => { console.log('disposed'); };
    }).startWith(null);
    return ipc$;
}

function main(sources) {
    setTimeout(() => electron.ipcRenderer.send("load-data"), 1000)
    return {
        DOM: sources.IPC
            .map(data =>
                 div([
                     h1('Menu'),
                     p(`Page Size: ${!data ? '' : data.patch.menu.pageSize}`),
                 ])
                )
    }
}

const drivers = {
    DOM: makeDOMDriver("#app"),
    IPC: ipcDriver,
}

Cycle.run(main, drivers);
