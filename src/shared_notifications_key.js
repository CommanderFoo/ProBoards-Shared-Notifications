Shared_Notifications.api.key = class {

	static init(){
		this.pb_key_obj = pb.plugin.key;

		return this.wrapper.bind(this);
	}

	/**
	 * @ignore
	 */

	static wrapper(key = ""){
		return Object.assign(Object.create(null), {

			exists: () => this.exists(key),
			obj: () => this.key_obj(key),
			is_empty: object_id => this.is_empty(key, object_id),
			has_value: object_id => !this.is_empty(key, object_id),
			get: (object_id, is_json) => this.get(key, object_id),
			clear: object_id => this.clear(key, object_id),
			set: (value, object_id, type) => this.set(key, value, object_id, type),
			on: (evt, value, object_id) => this.on(key, evt, value, object_id),
			push: (value, object_id) => this.push(key, value, object_id),
			type: (object_id, return_str) => this.type(key, return_str),
			len: object_id => this.len(key, object_id),
			super_forum_key: () => this.super_forum_key(key),
			has_space: object_id => this.has_space(key, object_id),
			space_left: object_id => this.space_left(key, object_id),
			max_space: () => this.max_space(key)

		});
	}

	/**
	 * Checks to see if a key exists.
	 *
	 * @param {String} key="" - The key to check.
	 *
	 * @return {Boolean}
	 */

	static exists(key = ""){
		if(key){
			if(typeof proboards.plugin._keys[key] != "undefined"){
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the ProBoards key object.
	 *
	 * @param {String} key="" - The key to get.
	 *
	 * @return {Object}
	 */

	static key_obj(key = ""){
		if(this.exists(key)){
			return this.pb_key_obj(key);
		}

		return {};
	}

	/**
	 * Checks to see if a key is empty
	 *
	 * @param {String} key="" - The key to check.
	 * @param {Number} [object_id=0] - This is the object id, proboards defaults to current user if not set.
	 *
	 * @return {Boolean}
	 */

	static is_empty(key = "", object_id = 0){
		if(this.exists(key)){
			if(typeof this.pb_key_obj(key).get != "undefined"){
				let val = this.pb_key_obj(key).get(object_id || undefined) || "";

				if(val.toString().length > 0 || JSON.stringify(val).length > 2){
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Gets the value stored in the key.
	 *
	 * @param {String} key="" - The ProBoards key we are getting.
	 * @param {Number} [object_id=0] - This is the object id, proboards defaults to current user if not set.
	 * @param {Boolean} [is_json=false] - If true, it will parse the JSON string.  ProBoards handles parsing now it seems.
	 *
	 * @returns {String|Object} - If no value, an empty string is returned.
	 */

	static get(key = "", object_id, is_json = false){
		if(this.exists(key)){
			object_id = object_id || undefined;

			if(!this.is_empty(key, object_id)){
				let value = this.pb_key_obj(key).get(object_id);

				if(is_json && Shared_Notifications.is_json(value)){
					value = JSON.parse(value);
				}

				return value;
			}
		}

		return "";
	}

	/**
	 * Clears out key value.
	 *
	 * @param {String} key="" - The key.
	 * @param {Number} [object_id=0] - This is the object id, proboards defaults to current user if not set.
	 *
	 * @return {Object} Returns a promise.
	 */

	static clear(key = "", object_id){
		return this.set(key, "", object_id);
	}

	/**
	 * Sets a key value.
	 *
	 * @param {String} key="" - The key.
	 * @param {String|Object} value="" - Can be a string, or a object.  ProBoards now handles stringifying objects.
	 * @param {Number} [object_id] - This is the object id, proboards defaults to current user if not set.
	 * @param {String} [type=""] - Passed on set the method type (i.e append, pop etc).
	 *
	 * @return {Object} - Returns a promise.
	 */

	static set(key = "", value = "", object_id, type = ""){
		let p = new Promise((resolve, reject) => {
			object_id = object_id || undefined;

			if(this.exists(key)){
				let options = {

					object_id,
					value

				};

				options.error = function(status){
					reject(status);
				};

				options.success = function(status){
					resolve(status);
				};

				if(type){
					switch(type){

						case "push" :
						case "unshift" :

							if(Array.isArray(options.value) && options.value.length > 1){
								options.values = options.value;
								delete options.value;
							}

							break;

						case "pop" :
						case "shift" :

							if(options.value){
								options.num_items = (~~ options.value);
								delete options.value;
							}

							break;
					}

					this.pb_key_obj(key)[type](options);
				} else {
					this.pb_key_obj(key).set(options);
				}
			} else {
				reject({
					message: "Key does not exist"
				});
			}

		});

		return p;
	}

	/**
	 * Key is set when an event occurs.
	 *
	 * @param {String} key="" - The key.
	 * @param {String} [event=""] - The event to use.
	 * @param {Mixed} value - The value to be stored in the key.  ProBoards handles stringify now.
	 * @param {Number} [object_id=undefined] - This is the object id, proboards defaults to current user if not set.
	 *
	 * @return {Boolean} - Returns true if successful (relies on what ProBoards .set returns).
	 */

	static on(key, event = "", value, object_id = undefined){
		if(!event){
			return false;
		}

		return this.pb_key_obj(key).set_on(event, object_id, value);
	}

	/**
	 * If the key is an array, adds the given value to the end of the array.
	 *
	 * @param {String} key - The key.
	 * @param {String|Array} value - The value to be pushed into the key.  This can be an array of values.
	 * @param {Number} [object_id] - This is the object id, proboards defaults to current user if not set.
	 *
	 * @return {Object} - Returns a promise.
	 */

	static push(key, value, object_id){
		value = (Array.isArray(value) && value.length == 1)? value[0] : value;

		return this.set(key, value, object_id, "push");
	}

	/**
	 * Get they key type.
	 *
	 * @param {String} key - The key.
	 * @param {Boolean} [return_str=false] - If true, it will return a string value (i.e "USER").
	 *
	 * @return {String}
	 */

	static type(key, return_str = false){
		let type = this.pb_key_obj(key).type();

		if(return_str){
			let types = pb.plugin.key_types();

			for(let k in types){
				if(types[k] == type){
					type = k;
					break;
				}
			}
		}

		return type;
	}

	/**
	 * Gets the length of a key.
	 *
	 * @param {String} key - The key to be checked.
	 * @param {Number} object_id - Object id.
	 *
	 * @return {Number} - Returns the length.
	 */

	static len(key, object_id){
		let val = this.get(key, object_id);

		if(typeof val == "string"){
			return val.length;
		}

		return (typeof val === "undefined")? 0 : JSON.stringify(val).length;
	}

	/**
	 * Checks to see if the key is a super_forum type.
	 *
	 * @param {String} key - The key to check.
	 *
	 * @return {Boolean}
	 */

	static super_forum_key(key){
		if(this.type(key) == 7){
			return true;
		}

		return false;
	}

	/**
	 * Checks to see if the key has space.
	 *
	 * @param {String} key - The key to check.
	 * @param {Number} object_id - Object id.
	 *
	 * @return {Boolean}
	 */

	static has_space(key, object_id){
		let max_length = (this.super_forum_key(key))? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");

		if(this.len(key, object_id) < max_length){
			return true;
		}

		return false;
	}

	/**
	 * Gets the space left in the key.
	 *
	 * @param {String} key - The key to check.
	 * @param {Number} object_id - Object id.
	 *
	 * @return {Number}
	 */

	static space_left(key, object_id){
		let max_length = (this.super_forum_key(key))? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");
		let key_length = this.len(key, object_id);
		let space_left = max_length - key_length;

		return (space_left < 0)? 0 : space_left;
	}

	/**
	 * Gets max space (characters).
	 *
	 * @param {String} key - The key to check.
	 *
	 * @return {Number}
	 */

	static max_space(key){
		let max_length = (this.super_forum_key(key))? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");

		return (max_length - 2);
	}

};

Shared_Notifications.api.key = Shared_Notifications.api.key.init();