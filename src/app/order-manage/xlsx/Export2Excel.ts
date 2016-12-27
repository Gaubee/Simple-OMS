import * as XLSX from 'xlsx-style';

function generateArray(table) {
    var out = [];
    var rows = table.querySelectorAll('tr');
    var ranges = [];
    for (var R = 0; R < rows.length; ++R) {
        var outRow = [];
        var row = rows[R];
        var columns = row.querySelectorAll('td');
        for (var C = 0; C < columns.length; ++C) {
            var cell = columns[C];
            var colspan = cell.getAttribute('colspan');
            var rowspan = cell.getAttribute('rowspan');
            var cellValue = cell.innerText;
            if (cellValue !== "" && cellValue == +cellValue) cellValue = +cellValue;

            //Skip ranges
            ranges.forEach(function (range) {
                if (R >= range.s.r && R <= range.e.r && outRow.length >= range.s.c && outRow.length <= range.e.c) {
                    for (var i = 0; i <= range.e.c - range.s.c; ++i) outRow.push(null);
                }
            });

            //Handle Row Span
            if (rowspan || colspan) {
                rowspan = rowspan || 1;
                colspan = colspan || 1;
                ranges.push({ s: { r: R, c: outRow.length }, e: { r: R + rowspan - 1, c: outRow.length + colspan - 1 } });
            };

            //Handle Value
            outRow.push(cellValue !== "" ? cellValue : null);

            //Handle Colspan
            if (colspan) for (var k = 0; k < colspan - 1; ++k) outRow.push(null);
        }
        out.push(outRow);
    }
    return [out, ranges];
};

function datenum(v, date1904?) {
    if (date1904) v += 1462;
    var epoch = Date.parse(v);
    return (epoch - +new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

export function sheet_from_array_of_arrays(data, opts: any = {}) {
    var ws = {};
    var styles = opts.styles || [];
    var range: any = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) range.s.r = R;
            if (range.s.c > C) range.s.c = C;
            if (range.e.r < R) range.e.r = R;
            if (range.e.c < C) range.e.c = C;
            var cell: any = { v: data[R][C] };
            if (cell.v == null) continue;
            var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });

            if (typeof cell.v === 'number') cell.t = 'n';
            else if (typeof cell.v === 'boolean') cell.t = 'b';
            else if (cell.v instanceof Date) {
                // cell.t = 'n';
                // cell.z = 'm/d/yy';
                // cell.v = datenum(cell.v);
                cell.t = 'd'
            }
            else {
                cell.t = 's';
            }
            cell.s = styles[R] && styles[R][C];

            ws[cell_ref] = cell;
        }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range, undefined);
    return ws;
}

export class Workbook {
    SheetNames = [];
    Sheets = {};
}

export function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

// export function export_table_to_excel(id) {
//     if (typeof id === "string") {
//         var theTable: HTMLTableElement = document.getElementById(id);
//     } else if (id instanceof HTMLTableElement) {
//         theTable = id;
//     } else {
//         throw new TypeError('args error!');
//     }
//     var oo = generateArray(theTable);
//     var ranges = oo[1];

//     /* original data */
//     var data = oo[0];
//     var ws_name = "SheetJS";
//     console.log(data);

//     var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);

//     /* add ranges to worksheet */
//     ws['!merges'] = ranges;

//     /* add worksheet to workbook */
//     wb.SheetNames.push(ws_name);
//     wb.Sheets[ws_name] = ws;

//     var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary' });

//     saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "test.xlsx")
// }