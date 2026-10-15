/**
 * CONFIGURATION: QUESTION IDs
 * Replace the numbers below with the IDs you found in Step 1.
 * These act as permanent anchors, so the text titles can change without breaking the script.
 */
const FORM_IDS = {
  MANAGER_NAME: 769250958,
  WHEN_WORKED: 643166850,
  DATE: 2071038481,
  TIME: 1527750500,
  
  // Note sections
  NOTES_OVERALL: 1953389477,
  NOTES_SETUP: 2043556495,
  NOTES_EVENT: 1784865493,
  NOTES_FACILITY: 106148654,
  NOTES_NEXT: 906005913
};

function createShiftReportDoc(e) {
  try {
    Logger.log('Function started.');
    
    // Check if the event object 'e' exists
    if (!e || !e.response) {
      Logger.log('ERROR: The event object (e) or e.response is missing.');
      return;
    }

    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();

    // Create a map of IDs to answers
    // WE USE IDs HERE INSTEAD OF TITLES
    const responseMap = {};
    
    itemResponses.forEach((itemResponse) => {
      // We get the ID, not the title
      const questionId = itemResponse.getItem().getId(); 
      let answer = itemResponse.getResponse();
      
      if (Array.isArray(answer)) {
        answer = answer.join(', ');
      }
      
      if (answer === null || answer === '') {
        answer = '';
      }
      
      // Map the answer to the ID
      responseMap[questionId] = String(answer);
    });

    // Extract key information using the IDs from our config object
    const managerName = responseMap[FORM_IDS.MANAGER_NAME] || 'Unknown';
    const shift = responseMap[FORM_IDS.WHEN_WORKED] || 'Unknown Shift';
    const date = responseMap[FORM_IDS.DATE] || new Date().toLocaleDateString();
    
    let time = responseMap[FORM_IDS.TIME] || 'N/A';
    if (time !== 'N/A') {
      time = formatTo12Hour(time);
    }
    
    // --- EXISTING CONFIGURATION ---
    const TARGET_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
    const CHAT_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL');
    // ---------------------

    let folder;
    try {
      if (!TARGET_FOLDER_ID) {
        throw new Error('TARGET_FOLDER_ID has not been set.');
      }
      folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    } catch (err) {
      Logger.log('Error finding folder: ' + err);
      // Fallback logic kept from your original script
      const fallbackFolderName = 'Shift Reports';
      const folders = DriveApp.getFoldersByName(fallbackFolderName);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(fallbackFolderName);
    }
    
    // Create document name
    const docName = 'Shift Report - ' + date + ' - ' + shift + ' - ' + managerName;
    
    // Create new Google Doc
    const doc = DocumentApp.create(docName);
    const body = doc.getBody();
    
    // Margins
    body.setMarginTop(50);
    body.setMarginBottom(50);
    body.setMarginLeft(60);
    body.setMarginRight(60);
    
    // Move document to folder
    const file = DriveApp.getFileById(doc.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    // ===== STYLING DEFINITIONS (Kept exactly as your original) =====
    const titleStyle = {};
    titleStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    titleStyle[DocumentApp.Attribute.FONT_SIZE] = 24;
    titleStyle[DocumentApp.Attribute.BOLD] = true;
    titleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#1a73e8';
    
    const subtitleStyle = {};
    subtitleStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    subtitleStyle[DocumentApp.Attribute.FONT_SIZE] = 12;
    subtitleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#5f6368';
    subtitleStyle[DocumentApp.Attribute.ITALIC] = true;
    
    const sectionHeaderStyle = {};
    sectionHeaderStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    sectionHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = 16;
    sectionHeaderStyle[DocumentApp.Attribute.BOLD] = true;
    sectionHeaderStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#202124';
    
    const infoLabelStyle = {};
    infoLabelStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    infoLabelStyle[DocumentApp.Attribute.FONT_SIZE] = 11;
    infoLabelStyle[DocumentApp.Attribute.BOLD] = true;
    infoLabelStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#5f6368';
    
    const infoValueStyle = {};
    infoValueStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    infoValueStyle[DocumentApp.Attribute.FONT_SIZE] = 11;
    infoValueStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#202124';
    
    const contentStyle = {};
    contentStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    contentStyle[DocumentApp.Attribute.FONT_SIZE] = 11;
    contentStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#202124';
    contentStyle[DocumentApp.Attribute.LINE_SPACING] = 1.5;
    
    const emptyStyle = {};
    emptyStyle[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
    emptyStyle[DocumentApp.Attribute.FONT_SIZE] = 11;
    emptyStyle[DocumentApp.Attribute.ITALIC] = true;
    emptyStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#9aa0a6';
    
    // ===== DOCUMENT HEADER =====
    const title = body.appendParagraph('Shift Report');
    title.setAttributes(titleStyle);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setSpacingAfter(4);
    
    const subtitle = body.appendParagraph(shift + ' Shift');
    subtitle.setAttributes(subtitleStyle);
    subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    subtitle.setSpacingAfter(20);
    
    // ===== INFO BOX =====
    const infoTable = body.appendTable();
    const infoRow = infoTable.appendTableRow();
    const infoCell = infoRow.appendTableCell();
    infoCell.setBackgroundColor('#f8f9fa');
    infoCell.setPaddingTop(12);
    infoCell.setPaddingBottom(12);
    infoCell.setPaddingLeft(16);
    infoCell.setPaddingRight(16);
    
    addInfoLine(infoCell, 'Manager:', managerName, infoLabelStyle, infoValueStyle);
    addInfoLine(infoCell, 'Date:', date, infoLabelStyle, infoValueStyle);
    addInfoLine(infoCell, 'Time:', time, infoLabelStyle, infoValueStyle);
    addInfoLine(infoCell, 'Submitted:', new Date().toLocaleString(), infoLabelStyle, infoValueStyle);
    
    infoTable.setBorderWidth(0);
    body.appendParagraph('').setSpacingAfter(20); 
    
    // ===== CONTENT SECTIONS (Using IDs) =====
    // Note: We use the IDs from the config to retrieve the text
    
    addSection(body, 'Overall Shift Notes', 
               responseMap[FORM_IDS.NOTES_OVERALL] || '',
               sectionHeaderStyle, contentStyle, emptyStyle);
               
    addSection(body, 'Event Set-Up Notes', 
               responseMap[FORM_IDS.NOTES_SETUP] || '',
               sectionHeaderStyle, contentStyle, emptyStyle);
               
    addSection(body, 'Current Event Notes', 
               responseMap[FORM_IDS.NOTES_EVENT] || '',
               sectionHeaderStyle, contentStyle, emptyStyle);
               
    addSection(body, 'Facility/Maintenance Issues', 
               responseMap[FORM_IDS.NOTES_FACILITY] || '',
               sectionHeaderStyle, contentStyle, emptyStyle);
               
    addSection(body, 'Notes for Next Shift', 
               responseMap[FORM_IDS.NOTES_NEXT] || '',
               sectionHeaderStyle, contentStyle, emptyStyle);
    
    // Save and close
    doc.saveAndClose();
    
    const docUrl = doc.getUrl();
    const finalDocName = doc.getName();
    
    Logger.log('Successfully created shift report: ' + docUrl);

    // --- Send notification to Google Chat ---
    if (CHAT_WEBHOOK_URL && CHAT_WEBHOOK_URL !== 'YOUR_CHAT_WEBHOOK_URL_GOES_HERE') {
      notifyGoogleChat(finalDocName, docUrl, managerName, shift, date, time);
    } else {
      Logger.log('Google Chat Webhook URL not set. Skipping notification.');
    }

  } catch (error) {
    Logger.log('Error processing form response: ' + error.toString());
  }
}

/**
 * Helper function to add an info line with label and value
 */
function addInfoLine(cell, label, value, labelStyle, valueStyle) {
  const p = cell.appendParagraph('');
  p.appendText(label + ' ').setAttributes(labelStyle);
  p.appendText(value).setAttributes(valueStyle);
  p.setSpacingAfter(4);
}

/**
 * Helper function to add a content section
 */
function addSection(body, title, content, headerStyle, contentStyle, emptyStyle) {
  // Section header
  const header = body.appendParagraph(title);
  header.setAttributes(headerStyle);
  header.setSpacingBefore(16);
  header.setSpacingAfter(8);
  
  // Content or empty message
  if (content && content.trim() !== '') {
    const contentPara = body.appendParagraph(content);
    contentPara.setAttributes(contentStyle);
    contentPara.setSpacingAfter(16);
  } else {
    const emptyPara = body.appendParagraph('No notes provided');
    emptyPara.setAttributes(emptyStyle);
    emptyPara.setSpacingAfter(16);
  }
  
  // Add subtle divider line
  const divider = body.appendParagraph('_'.repeat(80));
  divider.setAttributes({
    [DocumentApp.Attribute.FOREGROUND_COLOR]: '#e8eaed',
    [DocumentApp.Attribute.FONT_SIZE]: 6
  });
  divider.setSpacingAfter(0);
}

/**
 * Helper function to convert time to 12-hour format
 */
function formatTo12Hour(timeString) {
  try {
    // Handle various time formats
    let hours, minutes;
    
    // Try to parse the time string
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      hours = parseInt(parts[0]);
      minutes = parts[1] ? parts[1].substring(0, 2) : '00';
    } else {
      return timeString; // Return as-is if we can't parse it
    }
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return hours + ':' + minutes + ' ' + period;
  } catch (error) {
    Logger.log('Error formatting time: ' + error.toString());
    return timeString; // Return original if there's an error
  }
}

/**
 * Sends a notification message to a Google Chat space via Webhook.
 * @param {string} docName - The name of the newly created document.
 * @param {string} docUrl - The URL of the newly created document.
 * @param {string} managerName - The manager's name.
 * @param {string} shift - The shift type.
 * @param {string} date - The date of the shift.
 * @param {string} time - The time of the shift.
 */
function notifyGoogleChat(docName, docUrl, managerName, shift, date, time) {
  const CHAT_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL');

  // Create a formatted message for Google Chat
  const message = {
    'text': '📋 *New Shift Report Submitted*\n\n' +
            '*Manager:* ' + managerName + '\n' +
            '*Shift:* ' + shift + '\n' +
            '*Date:* ' + date + ' at ' + time + '\n\n' +
            '<' + docUrl + '|📄 View Report>'
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json; charset=UTF-8',
    'payload': JSON.stringify(message)
  };

  try {
    UrlFetchApp.fetch(CHAT_WEBHOOK_URL, options);
    Logger.log('Successfully sent notification to Google Chat.');
  } catch (err) {
    Logger.log('Error sending notification to Google Chat: ' + err.toString());
  }
}