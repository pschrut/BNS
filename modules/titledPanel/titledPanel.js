/* 
 * Creates a titled panel (similar to the ones on desktop applicatios to contain elements)
 * It accepts 2 arguments:
 *  - cssClass - The box CSS class
 *  - label    - The box text
 * @authors JoseFer
 */

/**
 * Creates a titled panel (similar to the ones on desktop applicatios to contain elements)
 *
 */
var TitledPanel = Class.create({
    /**
     * Stores the generated structure
     * @type Prototype.Element
     */
    _element: null,
    /**
     * Stores the content container
     * @type Prototype.Element
     */
    _content: null,
    /**
     * Contains the label span element
     * @type Prototype.Element
     */
    _label:   null,
    /**
     * Initializes the class
     * @param {Object} options The titled panel options
     */
    initialize: function(options) {
        this._createLayout(options);
    },
    /**
     * Creates the visual layout
     * @param options The layout options
     */
    _createLayout: function(options) {
        this._element = new Element('div', {'class': 'titledPanel_mainBox'});
        this._label   = new Element('span', {'class': 'titledPanel_label application_text_bolder'}).update(options.get('label'));
        this._content = new Element('div', {'class': 'titledPanel_content'});
        this._element.insert(this._label).insert(this._content);
    },
    /**
     * Gets the generated HTML
     * @return {Prototype.Element} The generated HTML code
     */
    getHtml: function() {
        return this._element;
    },
    /**
     * Sets the panel content
     * @param {Prototype.Element} content
     */
    setContent: function(content) {
        this._content.update(content);
    },
    /**
     * Insert content on the panel
     * @param {Prototype.Element} content The content to insert
     */
    insertContent: function(content) {
        this._content.insert(content);
    },
    /**
     * Sets the panel label
     * @param label The label text
     */
    setLabel: function(label) {
        this._label.update(label);
    },
    /**
     * Sets a style to the panel
     * @param style The CSS style
     */
    setStyle: function(style) {
        this._element.setStyle(style);
    }
});
