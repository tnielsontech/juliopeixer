/**
 * JÚLIO PEIXER PINTURAS - SISTEMA DE ORÇAMENTOS
 * Script de Sincronização em Nuvem (Google Sheets)
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Crie uma nova Planilha Google vazia.
 * 2. No menu superior da planilha, vá em: Extensões > Apps Script.
 * 3. Apague qualquer código existente no editor e cole todo este código abaixo.
 * 4. Clique no botão de Salvar (ícone de disquete).
 * 5. No canto superior direito, clique em "Implantar" > "Nova implantação".
 * 6. Clique no ícone de engrenagem de configuração e escolha "Aplicativo da Web".
 * 7. Preencha as configurações:
 *    - Descrição: Sincronização Orçamentos
 *    - Executar como: Você (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 8. Clique em "Implantar".
 * 9. O Google solicitará permissões de acesso aos dados. Conceda as autorizações na sua conta.
 * 10. Copie a "URL do aplicativo Web" gerada. Ela terá um formato parecido com:
 *     https://script.google.com/macros/s/AKfycb.../exec
 * 11. Abra o painel de configurações (botão "Itens") no sistema de orçamentos, cole o link na seção "Sincronização em Nuvem" e salve!
 */

function doGet(e) {
  var action = e.parameter.action;
  var result;
  
  if (action === "getBudgets") {
    result = getBudgets();
  } else if (action === "getLibrary") {
    result = getLibrary();
  } else {
    result = { error: "Ação inválida" };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "JSON inválido na requisição" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = data.action;
  var result;
  var success = true;
  var errorMsg = "";
  
  try {
    if (action === "saveBudget") {
      result = saveBudget(data.budget);
    } else if (action === "deleteBudget") {
      result = deleteBudget(data.id);
    } else if (action === "saveLibrary") {
      result = saveLibrary(data.services);
    } else {
      success = false;
      errorMsg = "Ação de POST desconhecida";
    }
  } catch(err) {
    success = false;
    errorMsg = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: success, error: errorMsg, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Auxiliar: obtém ou cria aba na planilha
function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ----------------------------------------------------
// OPERAÇÕES DE ORÇAMENTOS
// ----------------------------------------------------

function getBudgets() {
  var sheet = getOrCreateSheet("Orcamentos");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var budgets = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var budget = { client: {} };
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      
      if (!key) continue;
      
      if (key === "services") {
        try {
          budget.services = JSON.parse(val);
        } catch(e) {
          budget.services = [];
        }
      } else if (key.startsWith("client_")) {
        var clientKey = key.replace("client_", "");
        budget.client[clientKey] = val;
      } else {
        budget[key] = val;
      }
    }
    budgets.push(budget);
  }
  return budgets;
}

function saveBudget(budget) {
  var sheet = getOrCreateSheet("Orcamentos");
  var lastRow = sheet.getLastRow();
  var headers = [
    "id", "date", "status", "client_name", "client_phone", 
    "client_address", "client_city", "client_notes", "value", 
    "duration", "payment", "refDays", "refTeam", "notes", 
    "services", "createdAt", "updatedAt"
  ];
  
  var data = [];
  if (lastRow > 0) {
    data = sheet.getDataRange().getValues();
    headers = data[0];
  } else {
    sheet.appendRow(headers);
  }
  
  // Mapear orçamento para a linha na ordem dos cabeçalhos
  var rowValues = headers.map(function(key) {
    if (key === "services") {
      return JSON.stringify(budget.services || []);
    } else if (key.startsWith("client_")) {
      var clientKey = key.replace("client_", "");
      return budget.client ? (budget.client[clientKey] || "") : "";
    } else if (key === "updatedAt") {
      return new Date().toISOString();
    } else if (key === "createdAt") {
      return budget.createdAt || new Date().toISOString();
    } else {
      return budget[key] !== undefined ? budget[key] : "";
    }
  });
  
  // Buscar se orçamento já existe pelo ID
  var foundRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === budget.id) {
      foundRowIndex = i + 1; // 1-based index do Sheets + cabeçalho
      break;
    }
  }
  
  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return budget;
}

function deleteBudget(id) {
  var sheet = getOrCreateSheet("Orcamentos");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------
// OPERAÇÕES DE BIBLIOTECA DE SERVIÇOS
// ----------------------------------------------------

function getLibrary() {
  var sheet = getOrCreateSheet("Biblioteca");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var services = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var service = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      
      if (!key) continue;
      
      if (key === "active") {
        service[key] = (val === true || val === "true");
      } else {
        service[key] = val;
      }
    }
    services.push(service);
  }
  return services;
}

function saveLibrary(services) {
  var sheet = getOrCreateSheet("Biblioteca");
  sheet.clear();
  
  if (!services || services.length === 0) return true;
  
  var headers = ["id", "name", "category", "defaultText", "unit", "unitPrice", "active"];
  sheet.appendRow(headers);
  
  var rows = services.map(function(item) {
    return [
      item.id,
      item.name,
      item.category,
      item.defaultText,
      item.unit || "",
      item.unitPrice !== undefined && item.unitPrice !== "" ? Number(item.unitPrice) : "",
      item.active !== undefined ? item.active : true
    ];
  });
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  return true;
}
