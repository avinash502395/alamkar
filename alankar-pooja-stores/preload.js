const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  products: {
    list:        ()    => ipcRenderer.invoke('products:list'),
    byId:        (id)  => ipcRenderer.invoke('products:byId', id),
    byBarcode:   (bc)  => ipcRenderer.invoke('products:byBarcode', bc),
    smartLookup: (code) => ipcRenderer.invoke('products:smartLookup', code),
    nextQuickCode: () => ipcRenderer.invoke('products:nextQuickCode'),
    insert:      (p)   => ipcRenderer.invoke('products:insert', p),
    update:      (p)   => ipcRenderer.invoke('products:update', p),
    remove:      (id)  => ipcRenderer.invoke('products:remove', id),
    adjustStock: (id, delta) => ipcRenderer.invoke('products:adjustStock', id, delta),
  },
  customers: {
    list:    ()  => ipcRenderer.invoke('customers:list'),
    byPhone: (p) => ipcRenderer.invoke('customers:byPhone', p),
    insert:  (c) => ipcRenderer.invoke('customers:insert', c),
  },
  bills: {
    save:  (bill, items) => ipcRenderer.invoke('bills:save', bill, items),
    list:  (from, to, mode) => ipcRenderer.invoke('bills:list', from, to, mode),
    byId:  (id) => ipcRenderer.invoke('bills:byId', id),
    items: (id) => ipcRenderer.invoke('bills:items', id),
  },
  stock: {
    add:     (entry) => ipcRenderer.invoke('stock:add', entry),
    history: ()      => ipcRenderer.invoke('stock:history'),
  },
  credit: {
    recordPayment: (p)  => ipcRenderer.invoke('credit:recordPayment', p),
    entries:       ()   => ipcRenderer.invoke('credit:entries'),
    payments:      ()   => ipcRenderer.invoke('credit:payments'),
    totals:        ()   => ipcRenderer.invoke('credit:totals'),
  },
  reports: {
    dashboard: ()      => ipcRenderer.invoke('reports:dashboard'),
    gst:       (month) => ipcRenderer.invoke('reports:gst', month),
    gstFull:   (month) => ipcRenderer.invoke('reports:gstFull', month),
    monthly:   (month) => ipcRenderer.invoke('reports:monthly', month),
  },
  settings: {
    getAll: ()     => ipcRenderer.invoke('settings:getAll'),
    set:    (k,v)  => ipcRenderer.invoke('settings:set', k, v),
    setMany:(obj)  => ipcRenderer.invoke('settings:setMany', obj),
  },
  backup: {
    export:    ()    => ipcRenderer.invoke('backup:export'),
    getDbPath: ()    => ipcRenderer.invoke('backup:getDbPath'),
    auto:      (folder) => ipcRenderer.invoke('backup:auto', folder),
    pickFolder: ()   => ipcRenderer.invoke('backup:pickFolder'),
  },
  printHTML: (html, options) => ipcRenderer.invoke('print:html', html, options || {}),
  printerList: () => ipcRenderer.invoke('printer:list'),
  tscPrintRaw: (printerName, tspl) => ipcRenderer.invoke('tsc:printRaw', printerName, tspl),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
