/**
 * Google Slides API Handler for RexxJS ADDRESS GCP
 * Extracted module for better maintainability
 */

// ============================================================================
// SlidesHandler - Google Slides API integration
// ============================================================================

class SlidesHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.slides = null;
    this.auth = null;
    this.currentPresentationId = null;
  }

  async initialize() {
    console.log('[SlidesHandler] Initializing...');
    this.auth = await this.parent.getAuth([
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/drive.readonly'
    ]);

    if (this.auth) {
      console.log('[SlidesHandler] Auth obtained: SUCCESS');
      const { google } = require('googleapis');
      this.slides = google.slides({ version: 'v1', auth: this.auth });
      console.log('[SlidesHandler] Slides API initialized');
    } else {
      console.log('[SlidesHandler] Auth failed');
    }
  }

  async execute(command) {
    if (!this.slides) {
      await this.initialize();
    }

    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    // INFO command
    if (upperCommand === 'INFO') {
      return {
        success: true,
        service: 'Google Slides',
        version: '1.0.0',
        status: 'initialized',
        capabilities: ['INFO', 'CONNECT', 'READ', 'ADD_SLIDE', 'INSERT_TEXT'],
        currentPresentation: this.currentPresentationId
      };
    }

    // CONNECT command - connect to a presentation
    if (upperCommand.startsWith('CONNECT ')) {
      return await this.connect(trimmed.substring(8));
    }

    // READ command - read presentation structure
    if (upperCommand === 'READ' || upperCommand.startsWith('READ ')) {
      return await this.read(trimmed.substring(4).trim());
    }

    // GET_SLIDE command - get slide by index
    if (upperCommand.startsWith('GET_SLIDE ')) {
      return await this.getSlide(trimmed.substring(10));
    }

    // ADD_SLIDE command - add a new slide
    if (upperCommand.startsWith('ADD_SLIDE')) {
      return await this.addSlide(trimmed.substring(9).trim());
    }

    // DELETE command - delete a slide
    if (upperCommand.startsWith('DELETE ')) {
      return await this.deleteSlide(trimmed.substring(7));
    }

    // DUPLICATE command - duplicate a slide
    if (upperCommand.startsWith('DUPLICATE ')) {
      return await this.duplicateSlide(trimmed.substring(10));
    }

    // MOVE command - move a slide to new position
    if (upperCommand.startsWith('MOVE ')) {
      return await this.moveSlide(trimmed.substring(5));
    }

    // CLEAR_SLIDE command - remove all content from a slide
    if (upperCommand.startsWith('CLEAR_SLIDE ')) {
      return await this.clearSlide(trimmed.substring(12));
    }

    // SET_BACKGROUND command - set slide background color
    if (upperCommand.startsWith('SET_BACKGROUND ')) {
      return await this.setBackground(trimmed.substring(15));
    }

    // REPLACE_TEXT command - find and replace text in presentation
    if (upperCommand.startsWith('REPLACE_TEXT ')) {
      return await this.replaceText(trimmed.substring(13));
    }

    // INSERT_TEXT command - insert text into a slide
    if (upperCommand.startsWith('INSERT_TEXT ')) {
      return await this.insertText(trimmed.substring(12));
    }

    throw new Error(`Unknown SLIDES command: ${trimmed.split(' ')[0]}. Available: INFO, CONNECT, READ, GET_SLIDE, ADD_SLIDE, DELETE, DUPLICATE, MOVE, CLEAR_SLIDE, SET_BACKGROUND, REPLACE_TEXT, INSERT_TEXT`);
  }

  async connect(params) {
    // Parse: CONNECT presentation={presentationId}
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.presentation) {
      throw new Error('CONNECT requires presentation parameter. Use: SLIDES CONNECT presentation={presentationId}');
    }

    try {
      const response = await this.slides.presentations.get({
        presentationId: parsedParams.presentation
      });

      this.currentPresentationId = parsedParams.presentation;

      return {
        success: true,
        message: 'Connected to presentation',
        presentation: {
          presentationId: response.data.presentationId,
          title: response.data.title,
          slideCount: response.data.slides ? response.data.slides.length : 0,
          revisionId: response.data.revisionId
        }
      };
    } catch (e) {
      throw new Error(`Failed to connect to presentation: ${e.message}`);
    }
  }

  async read(params) {
    // Parse: READ [presentation={presentationId}]
    let presentationId = this.currentPresentationId;

    if (params) {
      const parsedParams = this.parseKeyValueParams(params);
      if (parsedParams.presentation) {
        presentationId = parsedParams.presentation;
      }
    }

    if (!presentationId) {
      throw new Error('No presentation specified. Use: SLIDES READ presentation={presentationId} or SLIDES CONNECT first');
    }

    try {
      const response = await this.slides.presentations.get({
        presentationId: presentationId
      });

      const slides = response.data.slides || [];
      const slideInfo = slides.map((slide, index) => ({
        slideId: slide.objectId,
        index: index + 1,
        title: this.extractSlideTitle(slide)
      }));

      return {
        success: true,
        presentation: {
          presentationId: response.data.presentationId,
          title: response.data.title,
          slideCount: slides.length,
          revisionId: response.data.revisionId
        },
        slides: slideInfo
      };
    } catch (e) {
      throw new Error(`Failed to read presentation: ${e.message}`);
    }
  }

  extractSlideTitle(slide) {
    // Try to extract title from slide elements
    if (!slide.pageElements) return 'Untitled Slide';

    for (const element of slide.pageElements) {
      if (element.shape && element.shape.shapeType === 'TEXT_BOX') {
        if (element.shape.text && element.shape.text.textElements) {
          for (const textElement of element.shape.text.textElements) {
            if (textElement.textRun && textElement.textRun.content) {
              return textElement.textRun.content.trim().substring(0, 50);
            }
          }
        }
      }
    }
    return 'Untitled Slide';
  }

  async getSlide(params) {
    // Parse: GET_SLIDE index={index}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.index && parsedParams.index !== 0) {
      throw new Error('GET_SLIDE requires index parameter. Use: SLIDES GET_SLIDE index={slideIndex}');
    }

    const slideIndex = parseInt(parsedParams.index);

    try {
      const response = await this.slides.presentations.get({
        presentationId: this.currentPresentationId
      });

      const slides = response.data.slides || [];

      if (slideIndex < 0 || slideIndex >= slides.length) {
        throw new Error(`Slide index ${slideIndex} out of range. Presentation has ${slides.length} slides (indices 0-${slides.length - 1})`);
      }

      const slide = slides[slideIndex];

      return {
        success: true,
        message: 'Slide retrieved',
        presentationId: this.currentPresentationId,
        index: slideIndex,
        slideId: slide.objectId,
        slide: {
          slideId: slide.objectId,
          title: this.extractSlideTitle(slide),
          pageElementCount: slide.pageElements ? slide.pageElements.length : 0
        }
      };
    } catch (e) {
      throw new Error(`Failed to get slide: ${e.message}`);
    }
  }

  async addSlide(params) {
    // Parse: ADD_SLIDE [index={index}] [title={title}] [body={body}]
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    const insertionIndex = parsedParams.index ? parseInt(parsedParams.index) : undefined;
    const hasContent = parsedParams.title || parsedParams.body;

    try {
      // First request: create the slide
      const requests = [{
        createSlide: {
          insertionIndex: insertionIndex,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          }
        }
      }];

      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: { requests }
      });

      const slideId = response.data.replies[0].createSlide.objectId;

      // If title or body provided, add them in a second batch
      if (hasContent) {
        const contentRequests = [];

        if (parsedParams.title) {
          const titleBoxId = 'titleBox_' + Date.now();
          contentRequests.push(
            {
              createShape: {
                objectId: titleBoxId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: 600, unit: 'PT' },
                    height: { magnitude: 80, unit: 'PT' }
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 50,
                    translateY: 50,
                    unit: 'PT'
                  }
                }
              }
            },
            {
              insertText: {
                objectId: titleBoxId,
                text: parsedParams.title
              }
            }
          );
        }

        if (parsedParams.body) {
          const bodyBoxId = 'bodyBox_' + Date.now();
          contentRequests.push(
            {
              createShape: {
                objectId: bodyBoxId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: 600, unit: 'PT' },
                    height: { magnitude: 300, unit: 'PT' }
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 50,
                    translateY: 150,
                    unit: 'PT'
                  }
                }
              }
            },
            {
              insertText: {
                objectId: bodyBoxId,
                text: parsedParams.body
              }
            }
          );
        }

        await this.slides.presentations.batchUpdate({
          presentationId: this.currentPresentationId,
          requestBody: { requests: contentRequests }
        });
      }

      return {
        success: true,
        message: hasContent ? 'Slide added with content' : 'Slide added',
        presentationId: this.currentPresentationId,
        slideId: slideId,
        index: insertionIndex,
        hasTitle: !!parsedParams.title,
        hasBody: !!parsedParams.body
      };
    } catch (e) {
      throw new Error(`Failed to add slide: ${e.message}`);
    }
  }

  async deleteSlide(params) {
    // Parse: DELETE slide={slideId}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('DELETE requires slide parameter. Use: SLIDES DELETE slide={slideId}');
    }

    try {
      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: [{
            deleteObject: {
              objectId: parsedParams.slide
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Slide deleted',
        presentationId: this.currentPresentationId,
        slideId: parsedParams.slide
      };
    } catch (e) {
      throw new Error(`Failed to delete slide: ${e.message}`);
    }
  }

  async duplicateSlide(params) {
    // Parse: DUPLICATE slide={slideId} [index={index}]
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('DUPLICATE requires slide parameter. Use: SLIDES DUPLICATE slide={slideId} [index={index}]');
    }

    const insertionIndex = parsedParams.index ? parseInt(parsedParams.index) : undefined;

    try {
      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: [{
            duplicateObject: {
              objectId: parsedParams.slide,
              objectIds: {
                [parsedParams.slide]: 'DUPLICATE_' + Date.now()
              }
            }
          }]
        }
      });

      const newSlideId = response.data.replies[0].duplicateObject.objectId;

      return {
        success: true,
        message: 'Slide duplicated',
        presentationId: this.currentPresentationId,
        originalSlideId: parsedParams.slide,
        newSlideId: newSlideId
      };
    } catch (e) {
      throw new Error(`Failed to duplicate slide: ${e.message}`);
    }
  }

  async moveSlide(params) {
    // Parse: MOVE slide={slideId} index={newIndex}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('MOVE requires slide parameter. Use: SLIDES MOVE slide={slideId} index={newIndex}');
    }

    if (!parsedParams.index && parsedParams.index !== 0) {
      throw new Error('MOVE requires index parameter. Use: SLIDES MOVE slide={slideId} index={newIndex}');
    }

    const newIndex = parseInt(parsedParams.index);

    try {
      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: [{
            updateSlidesPosition: {
              slideObjectIds: [parsedParams.slide],
              insertionIndex: newIndex
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Slide moved',
        presentationId: this.currentPresentationId,
        slideId: parsedParams.slide,
        newIndex: newIndex
      };
    } catch (e) {
      throw new Error(`Failed to move slide: ${e.message}`);
    }
  }

  async clearSlide(params) {
    // Parse: CLEAR_SLIDE slide={slideId}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('CLEAR_SLIDE requires slide parameter. Use: SLIDES CLEAR_SLIDE slide={slideId}');
    }

    try {
      // First, get the presentation to find all objects on the slide
      const response = await this.slides.presentations.get({
        presentationId: this.currentPresentationId
      });

      // Find the slide
      const slide = response.data.slides.find(s => s.objectId === parsedParams.slide);
      if (!slide) {
        throw new Error(`Slide not found: ${parsedParams.slide}`);
      }

      // Collect all page element object IDs to delete
      const objectIds = [];
      if (slide.pageElements) {
        for (const element of slide.pageElements) {
          objectIds.push(element.objectId);
        }
      }

      if (objectIds.length === 0) {
        return {
          success: true,
          message: 'Slide already empty',
          presentationId: this.currentPresentationId,
          slideId: parsedParams.slide,
          objectsRemoved: 0
        };
      }

      // Create delete requests for all objects
      const deleteRequests = objectIds.map(id => ({
        deleteObject: {
          objectId: id
        }
      }));

      // Execute batch delete
      await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: deleteRequests
        }
      });

      return {
        success: true,
        message: 'Slide cleared',
        presentationId: this.currentPresentationId,
        slideId: parsedParams.slide,
        objectsRemoved: objectIds.length
      };
    } catch (e) {
      throw new Error(`Failed to clear slide: ${e.message}`);
    }
  }

  async setBackground(params) {
    // Parse: SET_BACKGROUND slide={slideId} color={hexColor}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('SET_BACKGROUND requires slide parameter. Use: SLIDES SET_BACKGROUND slide={slideId} color={hexColor}');
    }

    if (!parsedParams.color) {
      throw new Error('SET_BACKGROUND requires color parameter. Use: SLIDES SET_BACKGROUND slide={slideId} color={hexColor}');
    }

    // Parse hex color (format: #RRGGBB or RRGGBB)
    let hexColor = parsedParams.color;
    if (hexColor.startsWith('#')) {
      hexColor = hexColor.substring(1);
    }

    if (hexColor.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hexColor)) {
      throw new Error('Invalid color format. Use hex format: #RRGGBB or RRGGBB (e.g., #FF5733 or FF5733)');
    }

    // Convert hex to RGB values (0-1 range)
    const r = parseInt(hexColor.substring(0, 2), 16) / 255;
    const g = parseInt(hexColor.substring(2, 4), 16) / 255;
    const b = parseInt(hexColor.substring(4, 6), 16) / 255;

    try {
      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: [{
            updatePageProperties: {
              objectId: parsedParams.slide,
              pageProperties: {
                pageBackgroundFill: {
                  solidFill: {
                    color: {
                      rgbColor: {
                        red: r,
                        green: g,
                        blue: b
                      }
                    }
                  }
                }
              },
              fields: 'pageBackgroundFill.solidFill.color'
            }
          }]
        }
      });

      return {
        success: true,
        message: 'Background color set',
        presentationId: this.currentPresentationId,
        slideId: parsedParams.slide,
        color: '#' + hexColor.toUpperCase(),
        rgb: { red: r, green: g, blue: b }
      };
    } catch (e) {
      throw new Error(`Failed to set background: ${e.message}`);
    }
  }

  async replaceText(params) {
    // Parse: REPLACE_TEXT find={text} replace={text} [slide={slideId}]
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.find) {
      throw new Error('REPLACE_TEXT requires find parameter. Use: SLIDES REPLACE_TEXT find={text} replace={text}');
    }

    if (!parsedParams.replace && parsedParams.replace !== '') {
      throw new Error('REPLACE_TEXT requires replace parameter. Use: SLIDES REPLACE_TEXT find={text} replace={text}');
    }

    try {
      const request = {
        replaceAllText: {
          containsText: {
            text: parsedParams.find,
            matchCase: true
          },
          replaceText: parsedParams.replace
        }
      };

      // If slide specified, limit replacement to that slide
      if (parsedParams.slide) {
        request.replaceAllText.pageObjectIds = [parsedParams.slide];
      }

      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: {
          requests: [request]
        }
      });

      const occurrences = response.data.replies[0].replaceAllText?.occurrencesChanged || 0;

      return {
        success: true,
        message: `Replaced ${occurrences} occurrence(s)`,
        presentationId: this.currentPresentationId,
        findText: parsedParams.find,
        replaceText: parsedParams.replace,
        occurrencesChanged: occurrences,
        slideId: parsedParams.slide || 'all slides'
      };
    } catch (e) {
      throw new Error(`Failed to replace text: ${e.message}`);
    }
  }

  async insertText(params) {
    // Parse: INSERT_TEXT slide={slideId} text={text}
    const parsedParams = this.parseKeyValueParams(params);

    if (!this.currentPresentationId) {
      throw new Error('No presentation connected. Use: SLIDES CONNECT presentation={presentationId} first');
    }

    if (!parsedParams.slide) {
      throw new Error('INSERT_TEXT requires slide parameter. Use: SLIDES INSERT_TEXT slide={slideId} text={text}');
    }

    if (!parsedParams.text) {
      throw new Error('INSERT_TEXT requires text parameter. Use: SLIDES INSERT_TEXT slide={slideId} text={text}');
    }

    try {
      // Create a text box on the slide
      const textBoxId = 'textBox_' + Date.now();
      const requests = [
        {
          createShape: {
            objectId: textBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: parsedParams.slide,
              size: {
                width: { magnitude: 300, unit: 'PT' },
                height: { magnitude: 50, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 50,
                translateY: 100,
                unit: 'PT'
              }
            }
          }
        },
        {
          insertText: {
            objectId: textBoxId,
            text: parsedParams.text
          }
        }
      ];

      const response = await this.slides.presentations.batchUpdate({
        presentationId: this.currentPresentationId,
        requestBody: { requests }
      });

      return {
        success: true,
        message: 'Text inserted',
        presentationId: this.currentPresentationId,
        slideId: parsedParams.slide,
        textBoxId: textBoxId,
        textLength: parsedParams.text.length
      };
    } catch (e) {
      throw new Error(`Failed to insert text: ${e.message}`);
    }
  }
}

module.exports = { SlidesHandler };
