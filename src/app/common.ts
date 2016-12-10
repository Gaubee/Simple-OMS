
export function mix_options<T>(tmp_options: T, new_options: any): T;

export function mix_options(tmp_options, new_options) {
    for (var key in new_options) {
        if (tmp_options.hasOwnProperty(key)) {
            if (tmp_options[key] instanceof Object && typeof tmp_options[key] !== "function") {
                if (new_options[key]) {
                    mix_options(tmp_options[key], new_options[key])
                } else {
                    tmp_options[key] = new_options[key];
                }
            } else {
                tmp_options[key] = new_options[key]
            }
        }
    }
    return tmp_options;
}
export function copy<T>(source: T): T;

export function copy(source) {
    var res = new source.constructor();
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && typeof source[key] !== "function") {
                res[key] = copy(source[key]);
            } else {
                res[key] = source[key];
            }
        }
    }
    return res;
}