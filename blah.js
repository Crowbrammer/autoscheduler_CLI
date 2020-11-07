function CreateTable (data) {
    
    for (var i in data) {
    var row = `<tr>
                    <td>${data[i].Billing_Count}</td>
                    <td>${data[i].Flag_Type}</td>
            `
    var table = document.querySelector("table-body");
    table.append(row)
    }
}
/*
1 - Loop Through Array & Access each value
2 - Create Table Rows & append to table
*/
  
let newData = [{Billing_Count: 'Whoop', Flag_Type: 'Amazing'}];
  
CreateTable(newData);