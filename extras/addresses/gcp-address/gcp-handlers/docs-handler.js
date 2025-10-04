/**
 * Google Docs API Handler for RexxJS ADDRESS GCP
 * Extracted module for better maintainability
 */

// ============================================================================
// DocsHandler - Google Docs API integration
// ============================================================================

class DocsHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.docs = null;
    this.drive = null;
    this.auth = null;
    this.currentDocId = null;
  }
  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str) {
    if (!interpolationConfig) {
      return str;
    }

    const variablePool = this.parent.variablePool || {};
    const pattern = interpolationConfig.getCurrentPattern();

    if (!pattern.hasDelims(str)) {
      return str;
    }

    return str.replace(pattern.regex, (match) => {
      const varName = pattern.extractVar(match);

      if (varName in variablePool) {
        return variablePool[varName];
      }

      return match; // Variable not found - leave as-is
    });
  }


  async initialize() {
    console.log('[DocsHandler] Initializing...');
    this.auth = await this.parent.getAuth([
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive'
    ]);

    if (this.auth) {
      console.log('[DocsHandler] Auth obtained: SUCCESS');
      const { google } = require('googleapis');
      this.docs = google.docs({ version: 'v1', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('[DocsHandler] Docs API initialized');
    } else {
      console.log('[DocsHandler] Auth failed');
    }
  }

  async execute(command) {
    if (!this.docs) {
      await this.initialize();
    }

    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // INFO command
    if (upperCommand === 'INFO') {
      return {
        success: true,
        service: 'Google Docs',
        version: '1.3.0',
        status: 'initialized',
        capabilities: ['INFO', 'CONNECT', 'INSERT', 'APPEND', 'REPLACE', 'CLEAR', 'READ'],
        currentDocument: this.currentDocId
      };
    }

    // CONNECT command - connect to a document
    if (upperCommand.startsWith('CONNECT ')) {
      return await this.connect(trimmed.substring(8));
    }

    // INSERT command - insert text at beginning of document
    if (upperCommand.startsWith('INSERT ')) {
      return await this.insert(trimmed.substring(7));
    }

    // INSERT_AT command - insert text at specific index
    if (upperCommand.startsWith('INSERT_AT ')) {
      return await this.insertAt(trimmed.substring(10));
    }

    // APPEND command - append text at end of document
    if (upperCommand.startsWith('APPEND ')) {
      return await this.append(trimmed.substring(7));
    }

    // REPLACE command - find and replace text
    if (upperCommand.startsWith('REPLACE ')) {
      return await this.replace(trimmed.substring(8));
    }

    // DELETE_RANGE command - delete text in a range
    if (upperCommand.startsWith('DELETE_RANGE ')) {
      return await this.deleteRange(trimmed.substring(13));
    }

    // FORMAT command - apply text formatting
    if (upperCommand.startsWith('FORMAT ')) {
      return await this.format(trimmed.substring(7));
    }

    // STYLE command - apply paragraph style
    if (upperCommand.startsWith('STYLE ')) {
      return await this.style(trimmed.substring(6));
    }

    // FIND command - find text positions
    if (upperCommand.startsWith('FIND ')) {
      return await this.find(trimmed.substring(5));
    }

    // EXTRACT command - extract text from range
    if (upperCommand.startsWith('EXTRACT ')) {
      return await this.extract(trimmed.substring(8));
    }

    // GET_LENGTH command - get document length
    if (upperCommand === 'GET_LENGTH') {
      return await this.getLength();
    }

    // SET_TITLE command - set document title
    if (upperCommand.startsWith('SET_TITLE ')) {
      return await this.setTitle(trimmed.substring(10));
    }

    // INSERT_TABLE command - insert a table
    if (upperCommand.startsWith('INSERT_TABLE ')) {
      return await this.insertTable(trimmed.substring(13));
    }

    // CLEAR command - clear all document content
    if (upperCommand === 'CLEAR') {
      return await this.clear();
    }

    // READ command - read document content
    if (upperCommand === 'READ' || upperCommand.startsWith('READ ')) {
      return await this.read(trimmed.substring(4).trim());
    }

    throw new Error(`Unknown DOCS command: ${trimmed.split(' ')[0]}. Available: INFO, CONNECT, INSERT, INSERT_AT, APPEND, REPLACE, DELETE_RANGE, FORMAT, STYLE, FIND, EXTRACT, GET_LENGTH, SET_TITLE, INSERT_TABLE, CLEAR, READ`);
  }

  async connect(params) {
    // Parse: CONNECT document={docId}
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.document) {
      throw new Error('CONNECT requires document parameter. Use: DOCS CONNECT document={docId}');
    }

    try {
      const response = await this.docs.documents.get({
        documentId: parsedParams.document
      });

      this.currentDocId = parsedParams.document;

      return {
        success: true,
        message: 'Connected to document',
        document: {
          documentId: response.data.documentId,
          title: response.data.title,
          revisionId: response.data.revisionId
        }
      };
    } catch (e) {
      throw new Error(`Failed to connect to document: ${e.message}`);
    }
  }

  async insert(params) {
    // Parse: INSERT text={text}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.text) {
      throw new Error('INSERT requires text parameter. Use: DOCS INSERT text={text}');
    }

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            insertText: {
              location: {
                index: 1 // Insert at beginning (after title if present)
              },
              text: parsedParams.text
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Text inserted at beginning',
        documentId: this.currentDocId,
        textLength: parsedParams.text.length
      };
    } catch (e) {
      throw new Error(`Failed to insert text: ${e.message}`);
    }
  }

  async insertAt(params) {
    // Parse: INSERT_AT index={index} text={text}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.index && parsedParams.index !== 0) {
      throw new Error('INSERT_AT requires index parameter. Use: DOCS INSERT_AT index={index} text={text}');
    }

    if (!parsedParams.text) {
      throw new Error('INSERT_AT requires text parameter. Use: DOCS INSERT_AT index={index} text={text}');
    }

    const index = parseInt(parsedParams.index);

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            insertText: {
              location: {
                index: index
              },
              text: parsedParams.text
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Text inserted at index ' + index,
        documentId: this.currentDocId,
        textLength: parsedParams.text.length,
        insertIndex: index
      };
    } catch (e) {
      throw new Error(`Failed to insert text at index: ${e.message}`);
    }
  }

  async append(params) {
    // Parse: APPEND text={text}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.text) {
      throw new Error('APPEND requires text parameter. Use: DOCS APPEND text={text}');
    }

    try {
      // First, get the document to find the end index
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // The end index is the last character in the document body
      const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;

      // Now append at that index
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            insertText: {
              location: {
                index: endIndex
              },
              text: parsedParams.text
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Text appended at end',
        documentId: this.currentDocId,
        textLength: parsedParams.text.length,
        insertIndex: endIndex
      };
    } catch (e) {
      throw new Error(`Failed to append text: ${e.message}`);
    }
  }

  async replace(params) {
    // Parse: REPLACE find={findText} replace={replaceText} [all={true|false}]
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.find) {
      throw new Error('REPLACE requires find parameter. Use: DOCS REPLACE find={text} replace={text}');
    }

    if (!parsedParams.replace && parsedParams.replace !== '') {
      throw new Error('REPLACE requires replace parameter. Use: DOCS REPLACE find={text} replace={text}');
    }

    const replaceAll = parsedParams.all === 'true' || parsedParams.all === true || !parsedParams.all;

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            replaceAllText: {
              containsText: {
                text: parsedParams.find,
                matchCase: true
              },
              replaceText: parsedParams.replace
            }
          }]
        }
      });

      const occurrences = response.data.replies[0].replaceAllText?.occurrencesChanged || 0;

      return {
        success: true,
        message: `Replaced ${occurrences} occurrence(s)`,
        documentId: this.currentDocId,
        findText: parsedParams.find,
        replaceText: parsedParams.replace,
        occurrencesChanged: occurrences
      };
    } catch (e) {
      throw new Error(`Failed to replace text: ${e.message}`);
    }
  }

  async deleteRange(params) {
    // Parse: DELETE_RANGE start={startIndex} end={endIndex}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.start && parsedParams.start !== 0) {
      throw new Error('DELETE_RANGE requires start parameter. Use: DOCS DELETE_RANGE start={startIndex} end={endIndex}');
    }

    if (!parsedParams.end && parsedParams.end !== 0) {
      throw new Error('DELETE_RANGE requires end parameter. Use: DOCS DELETE_RANGE start={startIndex} end={endIndex}');
    }

    const startIndex = parseInt(parsedParams.start);
    const endIndex = parseInt(parsedParams.end);

    if (endIndex <= startIndex) {
      throw new Error('DELETE_RANGE: end index must be greater than start index');
    }

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            deleteContentRange: {
              range: {
                startIndex: startIndex,
                endIndex: endIndex
              }
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Range deleted',
        documentId: this.currentDocId,
        startIndex: startIndex,
        endIndex: endIndex,
        charactersRemoved: endIndex - startIndex
      };
    } catch (e) {
      throw new Error(`Failed to delete range: ${e.message}`);
    }
  }

  async format(params) {
    // Parse: FORMAT start={startIndex} end={endIndex} bold={true|false} italic={true|false} underline={true|false} size={fontSize}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.start && parsedParams.start !== 0) {
      throw new Error('FORMAT requires start parameter. Use: DOCS FORMAT start={startIndex} end={endIndex} [bold=true] [italic=true] [underline=true] [size=14]');
    }

    if (!parsedParams.end && parsedParams.end !== 0) {
      throw new Error('FORMAT requires end parameter. Use: DOCS FORMAT start={startIndex} end={endIndex} [bold=true] [italic=true] [underline=true] [size=14]');
    }

    const startIndex = parseInt(parsedParams.start);
    const endIndex = parseInt(parsedParams.end);

    if (endIndex <= startIndex) {
      throw new Error('FORMAT: end index must be greater than start index');
    }

    // Build text style object
    const textStyle = {};
    const fields = [];

    if (parsedParams.bold !== undefined) {
      textStyle.bold = parsedParams.bold === 'true' || parsedParams.bold === true;
      fields.push('bold');
    }

    if (parsedParams.italic !== undefined) {
      textStyle.italic = parsedParams.italic === 'true' || parsedParams.italic === true;
      fields.push('italic');
    }

    if (parsedParams.underline !== undefined) {
      textStyle.underline = parsedParams.underline === 'true' || parsedParams.underline === true;
      fields.push('underline');
    }

    if (parsedParams.size) {
      textStyle.fontSize = {
        magnitude: parseInt(parsedParams.size),
        unit: 'PT'
      };
      fields.push('fontSize');
    }

    if (fields.length === 0) {
      throw new Error('FORMAT requires at least one formatting option: bold, italic, underline, or size');
    }

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            updateTextStyle: {
              range: {
                startIndex: startIndex,
                endIndex: endIndex
              },
              textStyle: textStyle,
              fields: fields.join(',')
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Formatting applied',
        documentId: this.currentDocId,
        startIndex: startIndex,
        endIndex: endIndex,
        formatting: textStyle,
        fieldsUpdated: fields
      };
    } catch (e) {
      throw new Error(`Failed to format text: ${e.message}`);
    }
  }

  async style(params) {
    // Parse: STYLE start={startIndex} end={endIndex} type={HEADING_1|HEADING_2|HEADING_3|TITLE|SUBTITLE|NORMAL_TEXT}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.start && parsedParams.start !== 0) {
      throw new Error('STYLE requires start parameter. Use: DOCS STYLE start={startIndex} end={endIndex} type={HEADING_1|HEADING_2|HEADING_3|TITLE|SUBTITLE|NORMAL_TEXT}');
    }

    if (!parsedParams.end && parsedParams.end !== 0) {
      throw new Error('STYLE requires end parameter. Use: DOCS STYLE start={startIndex} end={endIndex} type={HEADING_1|HEADING_2|HEADING_3|TITLE|SUBTITLE|NORMAL_TEXT}');
    }

    if (!parsedParams.type) {
      throw new Error('STYLE requires type parameter. Use: DOCS STYLE start={startIndex} end={endIndex} type={HEADING_1|HEADING_2|HEADING_3|TITLE|SUBTITLE|NORMAL_TEXT}');
    }

    const startIndex = parseInt(parsedParams.start);
    const endIndex = parseInt(parsedParams.end);

    if (endIndex <= startIndex) {
      throw new Error('STYLE: end index must be greater than start index');
    }

    // Map user-friendly names to Google Docs named style types
    const styleMap = {
      'HEADING_1': 'HEADING_1',
      'H1': 'HEADING_1',
      'HEADING_2': 'HEADING_2',
      'H2': 'HEADING_2',
      'HEADING_3': 'HEADING_3',
      'H3': 'HEADING_3',
      'HEADING_4': 'HEADING_4',
      'H4': 'HEADING_4',
      'TITLE': 'TITLE',
      'SUBTITLE': 'SUBTITLE',
      'NORMAL_TEXT': 'NORMAL_TEXT',
      'NORMAL': 'NORMAL_TEXT'
    };

    const styleType = styleMap[parsedParams.type.toUpperCase()];
    if (!styleType) {
      throw new Error(`Invalid style type: ${parsedParams.type}. Valid types: HEADING_1, HEADING_2, HEADING_3, HEADING_4, TITLE, SUBTITLE, NORMAL_TEXT (or H1, H2, H3, H4, NORMAL)`);
    }

    try {
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            updateParagraphStyle: {
              range: {
                startIndex: startIndex,
                endIndex: endIndex
              },
              paragraphStyle: {
                namedStyleType: styleType
              },
              fields: 'namedStyleType'
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Paragraph style applied',
        documentId: this.currentDocId,
        startIndex: startIndex,
        endIndex: endIndex,
        styleType: styleType
      };
    } catch (e) {
      throw new Error(`Failed to apply style: ${e.message}`);
    }
  }

  async find(params) {
    // Parse: FIND text={text}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.text) {
      throw new Error('FIND requires text parameter. Use: DOCS FIND text={searchText}');
    }

    try {
      // Read the document content
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // Extract text content with position tracking
      let fullText = '';
      const contentBlocks = [];

      if (doc.data.body && doc.data.body.content) {
        for (const element of doc.data.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun) {
                const startIndex = elem.startIndex;
                const endIndex = elem.endIndex;
                const text = elem.textRun.content;
                contentBlocks.push({
                  startIndex: startIndex,
                  endIndex: endIndex,
                  text: text
                });
                fullText += text;
              }
            }
          }
        }
      }

      // Search for all occurrences of the text
      const searchText = parsedParams.text;
      const occurrences = [];
      let pos = 0;

      while ((pos = fullText.indexOf(searchText, pos)) !== -1) {
        // Map the position in fullText to document index
        let charCount = 0;
        let docIndex = 1; // Document content starts at index 1

        for (const block of contentBlocks) {
          if (charCount + block.text.length > pos) {
            // Found the block containing this occurrence
            docIndex = block.startIndex + (pos - charCount);
            break;
          }
          charCount += block.text.length;
        }

        occurrences.push({
          position: pos,
          startIndex: docIndex,
          endIndex: docIndex + searchText.length,
          text: searchText
        });

        pos += searchText.length;
      }

      return {
        success: true,
        message: `Found ${occurrences.length} occurrence(s)`,
        documentId: this.currentDocId,
        searchText: searchText,
        occurrences: occurrences,
        count: occurrences.length
      };
    } catch (e) {
      throw new Error(`Failed to find text: ${e.message}`);
    }
  }

  async extract(params) {
    // Parse: EXTRACT start={startIndex} end={endIndex}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.start && parsedParams.start !== 0) {
      throw new Error('EXTRACT requires start parameter. Use: DOCS EXTRACT start={startIndex} end={endIndex}');
    }

    if (!parsedParams.end && parsedParams.end !== 0) {
      throw new Error('EXTRACT requires end parameter. Use: DOCS EXTRACT start={startIndex} end={endIndex}');
    }

    const startIndex = parseInt(parsedParams.start);
    const endIndex = parseInt(parsedParams.end);

    if (endIndex <= startIndex) {
      throw new Error('EXTRACT: end index must be greater than start index');
    }

    try {
      // Read the document content
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // Extract text content with position tracking
      let fullText = '';
      const contentBlocks = [];

      if (doc.data.body && doc.data.body.content) {
        for (const element of doc.data.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun) {
                const blockStart = elem.startIndex;
                const blockEnd = elem.endIndex;
                const text = elem.textRun.content;
                contentBlocks.push({
                  startIndex: blockStart,
                  endIndex: blockEnd,
                  text: text
                });
                fullText += text;
              }
            }
          }
        }
      }

      // Extract the text in the specified range
      let extractedText = '';
      let charCount = 1; // Document starts at index 1

      for (const block of contentBlocks) {
        const blockStart = block.startIndex;
        const blockEnd = block.endIndex;
        const blockText = block.text;

        // Check if this block overlaps with our extraction range
        if (blockEnd > startIndex && blockStart < endIndex) {
          // Calculate the slice within this block
          const localStart = Math.max(0, startIndex - blockStart);
          const localEnd = Math.min(blockText.length, endIndex - blockStart);

          extractedText += blockText.substring(localStart, localEnd);
        }
      }

      return {
        success: true,
        message: 'Text extracted',
        documentId: this.currentDocId,
        startIndex: startIndex,
        endIndex: endIndex,
        length: extractedText.length,
        text: extractedText
      };
    } catch (e) {
      throw new Error(`Failed to extract text: ${e.message}`);
    }
  }

  async getLength() {
    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    try {
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // Get the end index of the document (total character count)
      const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;

      // Also count actual text characters (excluding structural characters)
      let textCharCount = 0;
      if (doc.data.body && doc.data.body.content) {
        for (const element of doc.data.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun) {
                textCharCount += elem.textRun.content.length;
              }
            }
          }
        }
      }

      return {
        success: true,
        message: 'Document length retrieved',
        documentId: this.currentDocId,
        length: endIndex,
        textLength: textCharCount
      };
    } catch (e) {
      throw new Error(`Failed to get document length: ${e.message}`);
    }
  }

  async setTitle(params) {
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.title) {
      throw new Error('SET_TITLE requires title parameter. Use: DOCS SET_TITLE title={newTitle}');
    }

    try {
      // Update document title using Drive API
      const driveFile = await this.drive.files.get({
        fileId: this.currentDocId,
        fields: 'name'
      });

      const oldTitle = driveFile.data.name;

      await this.drive.files.update({
        fileId: this.currentDocId,
        requestBody: {
          name: parsedParams.title
        }
      });

      return {
        success: true,
        message: 'Document title updated',
        documentId: this.currentDocId,
        oldTitle: oldTitle,
        newTitle: parsedParams.title
      };
    } catch (e) {
      throw new Error(`Failed to set document title: ${e.message}`);
    }
  }

  async insertTable(params) {
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    if (!parsedParams.rows) {
      throw new Error('INSERT_TABLE requires rows parameter. Use: DOCS INSERT_TABLE rows={numRows} cols={numCols}');
    }

    if (!parsedParams.cols) {
      throw new Error('INSERT_TABLE requires cols parameter. Use: DOCS INSERT_TABLE rows={numRows} cols={numCols}');
    }

    const rows = parseInt(parsedParams.rows);
    const cols = parseInt(parsedParams.cols);

    if (rows < 1 || rows > 20) {
      throw new Error('INSERT_TABLE: rows must be between 1 and 20');
    }

    if (cols < 1 || cols > 20) {
      throw new Error('INSERT_TABLE: cols must be between 1 and 20');
    }

    try {
      // Get document to find insertion point
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // Insert at end of document
      const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;

      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            insertTable: {
              rows: rows,
              columns: cols,
              location: {
                index: endIndex
              }
            }
          }]
        }
      });

      return {
        success: true,
        message: `Table inserted (${rows}x${cols})`,
        documentId: this.currentDocId,
        rows: rows,
        columns: cols,
        insertIndex: endIndex
      };
    } catch (e) {
      throw new Error(`Failed to insert table: ${e.message}`);
    }
  }

  async clear() {
    if (!this.currentDocId) {
      throw new Error('No document connected. Use: DOCS CONNECT document={docId} first');
    }

    try {
      // First, get the document to find its content range
      const doc = await this.docs.documents.get({
        documentId: this.currentDocId
      });

      // Calculate the range to delete (everything except index 1, which is the start)
      const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;

      // Delete all content
      const response = await this.docs.documents.batchUpdate({
        documentId: this.currentDocId,
        requestBody: {
          requests: [{
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: endIndex
              }
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Document cleared',
        documentId: this.currentDocId,
        charactersRemoved: endIndex - 1
      };
    } catch (e) {
      throw new Error(`Failed to clear document: ${e.message}`);
    }
  }

  async read(params) {
    // Parse: READ [document={docId}]
    let docId = this.currentDocId;

    if (params) {
      const parsedParams = this.parseKeyValueParams(params);
      if (parsedParams.document) {
        docId = parsedParams.document;
      }
    }

    if (!docId) {
      throw new Error('No document specified. Use: DOCS READ document={docId} or DOCS CONNECT first');
    }

    try {
      const response = await this.docs.documents.get({
        documentId: docId
      });

      // Extract text content from document structure
      let textContent = '';
      if (response.data.body && response.data.body.content) {
        for (const element of response.data.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun) {
                textContent += elem.textRun.content;
              }
            }
          }
        }
      }

      return {
        success: true,
        document: {
          documentId: response.data.documentId,
          title: response.data.title,
          revisionId: response.data.revisionId
        },
        content: textContent,
        length: textContent.length
      };
    } catch (e) {
      throw new Error(`Failed to read document: ${e.message}`);
    }
  }
}

module.exports = { DocsHandler };
