const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

const COMPLEX_VALUE_RE = /^chrome:\/\/.+\/locale\/.+\.properties/;
const prefSvc = Services.prefs;

this.ghostery = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      ghostery: {
        getPref(prefName) {
          let value = null;
          try {
            switch (prefSvc.getPrefType(prefName)) {
              case prefSvc.PREF_BOOL:
                value = prefSvc.getBoolPref(prefName);
                break;
              case prefSvc.PREF_STRING: {
                let charVal = prefSvc.getCharPref(prefName);
                // it might be a complex value
                if (COMPLEX_VALUE_RE.test(charVal)) {
                  try {
                    charVal = prefSvc.getComplexValue(
                      prefName,
                      Components.interfaces.nsIPrefLocalizedString,
                    ).data;
                  } catch (e) {
                    break;
                  }
                }
                value = charVal;
                break;
              }
              case prefSvc.PREF_INT:
                value = prefSvc.getIntPref(prefName);
                break;
              case prefSvc.PREF_INVALID:
              default:
                break;
            }
          } catch (e) {
            // nothing
          }
          return value;
        }
      }
    }
  }
};
