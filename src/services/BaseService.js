/**
 * Base service class
 *
 * Author:    Phong Mai
 * Timestamp: 6/5/13 6:11 PM
 */
var BaseService = function(type) {
    this._type = type;
    this._id = null;
};

/**
 * Get the name for the service
 *
 * @returns {*}
 */
BaseService.prototype.getType = function() {
    return this._type;
};

/**
 * Set the id for the service
 *
 * @param id
 */
BaseService.prototype.setId = function(id) {
    this._id = id;
};

/**
 * Get the id for the service
 * @returns {*}
 */
BaseService.prototype.getId = function() {
    return this._id;
};

/**
 * Initialize the service
 */
BaseService.prototype.initialize = function(options) {
    throw new Error('BaseService initialize not defined');
};

module.exports = BaseService;
