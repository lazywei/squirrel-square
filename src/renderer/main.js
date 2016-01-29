import Rx from 'rx'
import Cycle from '@cycle/core'
import { makeDOMDriver,
         div, p, h1, button,
         form, input, label, option, select,
       } from '@cycle/dom'
import electron from 'electron'
import _ from 'lodash'

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
    const request$ = clickEv$.map(
        () => {
            return {
                msg: 'load-data',
                payload: { filename: 'default.custom.yaml' }
            }
        })

    const state$ = Rx.Observable.combineLatest(
        sources.IPC.startWith(null),
        sources.DOM.select('select#page-size')
            .events('change')
            .map(ev => ev.target.value)
            .startWith("1"),
        (data, selectedValue) => {
            console.log(selectedValue)
            return { data, selectedValue }
        })

    return {
        DOM: state$.map(
            ({data, selectedValue}) =>
                form([
                    div('.form-group', [
                        label('Page Size'),
                        data === null? null : select('.form-control#page-size',
                               _.range(1, 11).map(i => {
                                   return option({selected: i === data.patch.menu.pageSize ?
                                                  true : false}, i.toString())
                               }))
                    ])
                    // div('.col-xs-6', [
                    //     'Page Size',
                    //     // p('Schema List'),
                    // ]),
                    // div('.col-xs-6', [
                    //     input({type: 'text', value: data.patch.menu.pageSize})
                    //     // data.patch.schemaList.map(({schema}) => p(schema)),
                    // ]),
                    // button("Reload Data"),
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
