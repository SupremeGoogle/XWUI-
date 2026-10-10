/** Component definition and geometry constants. */
export const DEFINITION = {
  "id": "XWFHeroScene",
  "component": "XWFHeroScene",
  "properties": {
    "data": {
      "properties": {
        "scene": {
          "default": {}
        },
        "zoom": {
          "default": 1
        },
        "busy": {
          "default": false
        },
        "uid": {
          "type": "string"
        }
      }
    },
    "conf_comp": {
      "properties": {
        "className": {
          "type": "string"
        }
      }
    }
  }
};
export const HERO_ZOOM = Object.freeze({min:0.6,max:1.3,step:0.1,initial:1});
