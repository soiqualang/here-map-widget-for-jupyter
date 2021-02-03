/*
  Copyright (C) 2019-2021 HERE Europe B.V.
  SPDX-License-Identifier: MIT
*/
const provider = require('./Provider.js');
const widgets = require('@jupyter-widgets/base');

export class XYZModel extends provider.ProviderModel {
  defaults() {
    return {
      //      ...super.defaults(),
      _view_name: 'XYZView',
      _model_name: 'XYZModel',

      token: '',
      space_id: '',
      evt_type: 'tap',
      show_bubble: false,
      style: null,
    };
  }
}

XYZModel.serializers = _.extend({
  style: {
    deserialize: widgets.unpack_models
  },
}, widgets.DOMWidgetModel.serializers);


export class XYZView extends provider.ProviderView {
  create_obj() {
    var platform = new H.service.Platform({
      apikey: this.map_view.model.get('api_key')
    });
    const service = platform.getXYZService({
      token: this.model.get('token'),
    });
    this.bubble = null; // handle to on/off the bubble.
    this.obj = new H.service.xyz.Provider(service, this.model.get('space_id'), {});
    // Add style at load time
    if (this.model.get('style')) {
      this.create_child_view(this.model.get('style')).then((view) => {
        this.obj.setStyle(view.obj);
      });
    }
    var map = this.map_view.obj;
    this.obj.addEventListener("pointermove", (evnt) => {
      const data = evnt.target.getData();
      this.send({
        event: evnt.type,
        position: map.screenToGeo(evnt.currentPointer.viewportX, evnt.currentPointer.viewportY),
        properties: data.properties,
        id: data.properties.id,
        space_id: data.source_layer,
      });
      //          evnt.target.addEventListener("pointerleave", (targetEvent) => {
      //            });
    });

    this.obj.addEventListener("tap", (evnt) => {
      const data = evnt.target.getData();
      this.send({
        event: evnt.type,
        position: map.screenToGeo(evnt.currentPointer.viewportX, evnt.currentPointer.viewportY),
        properties: data.properties,
        id: data.properties.id,
        space_id: data.source_layer,
      });
      //          evnt.target.addEventListener("pointerleave", (targetEvent) => {
      //            });
    });

    var style = this.obj.getStyle();
    style.setInteractive(['xyz'], true);
  }

  model_events() {}

  mapjs_events() {
    var evt_type = this.model.get('evt_type');
    var map = this.map_view.obj;
    var ui = this.map_view.ui;
    const handle = this;

    if (this.model.get('show_bubble')) {
      this.obj.addEventListener(evt_type, function(evt) {
        var position = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY),
          data = evt.target.getData();
        var rows = Object.keys(data.properties).map((key) =>
          `<tr><td>${key}:</td><td>${data.properties[key]}</td></tr>`
        );
        if (!handle.bubble) {
          handle.bubble = new H.ui.InfoBubble(position, {
            content: `<div style="max-height:300px; overflow:auto"><table style="font-size:10px">${rows.join('')}</table></div>`
          });
          ui.addBubble(handle.bubble);
        } else {
          handle.bubble.setContent(`<div style="max-height:300px; overflow:auto"><table style="font-size:10px">${rows.join('')}</table></div>`);
          handle.bubble.setPosition(position);
          handle.bubble.open();
        }
        map.setCenter(position, true);
      });
    }
  }

}