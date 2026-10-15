function logFormIds() {
  // Open the form by ID (or use openByUrl if you prefer)
  // Since this script is bound to the form, you can usually just use:
  var form = FormApp.getActiveForm();
  var items = form.getItems();
  
  Logger.log('--- FORM ITEM IDs ---');
  for (var i = 0; i < items.length; i++) {
    Logger.log('Title: "' + items[i].getTitle() + '" | ID: ' + items[i].getId());
  }
  Logger.log('---------------------');
}