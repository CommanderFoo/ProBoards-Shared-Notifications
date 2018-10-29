class Shared_Notifications {

	static init(){
		this.VERSION = "1.0.0";

		this.PLUGIN_KEY = "pd_shared_notifications";
		this.PLUGIN_ID = "pd_shared_notifications";

		this.PLUGIN = null;
		this.SETTINGS = null;
		this.IMAGES = null;


		this.events = Object.create(null);

		this.KEY_DATA = new Map();

		this.ROUTE = pb.data("route");

		this.setup();
		this.setup_data();
		this.api.init();

		this.can_view = this.api.permission().can_view();

		if(this.can_view){
			Shared_Notifications_Display.init();
		}

		$(this.ready.bind(this));
	}

	static ready(){
		if(this.can_view){
			if(this.ROUTE.name == "show_user_notifications"){
				Shared_Notifications_Display.display_list();
			}

			if(this.ROUTE.name.match(/^show_user_/i) || this.ROUTE.name == "user"){
				Shared_Notifications_Display.set_tab_count();
			}

			Shared_Notifications_Display.display_tip();
		}

		// Example code / debug

		/*$("#create-notification").click(() => {

			let msg = "Hi " + (+ new Date());

			let p = this.api.create().notification(msg);

			if(p != null){
				p.then(s => {

					console.log(JSON.stringify(this.api.get().notifications()).length);

				}).catch(v => console.log(v));
			}

		});

		$("#get-notifications").click(() => {

			console.log(this.api.get().notifications());

		});*/

	}

	static setup(){
		let plugin = pb.plugin.get(this.PLUGIN_ID);

		if(plugin && plugin.settings){
			this.PLUGIN = plugin;
			this.SETTINGS = plugin.settings;

			if(plugin.images){
				this.IMAGES = plugin.images;
			}
		}
	}

	static setup_data(){
		/*let data = proboards.plugin.keys.data[this.PLUGIN_KEY];

		for(let [object_key, value] of Object.entries(data)){
			let id = parseInt(object_key, 10) || 0;

			if(id > 0){
				let user_data = this.KEY_DATA.get(id);

				if(!user_data){
					user_data = new profile_notifications.data(id);
					this.KEY_DATA.set(id, user_data);
				}

				user_data.setup(value);
			}
		}*/
	}

	static html_encode(str = "", decode_first = false){
		str = (decode_first)? this.html_decode(str) : str;

		return $("<div />").text(str).html();
	}

	static html_decode(str = ""){
		this._textarea.innerHTML = str;

		let val = this._textarea.value;

		this._textarea.innerHTML = "";

		return val;
	}

	static is_json(str = "", return_obj = false){
		try {
			str = JSON.parse(str);
		} catch(e){
			return false;
		}

		if(return_obj){
			return str;
		}

		return true;
	}

	static number_format(str = "", delim = ","){
		return (str.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delim) || "0");
	}

}

class Shared_Notifications_Display {

	static init(){
		this.total_showing = parseInt(Shared_Notifications.SETTINGS.show, 10);
		this.notifications = Shared_Notifications.api.get().notifications().slice().reverse();
	}

	static display_tip(){
		let total_unviewed = this.get_total_unviewed_notifications();

		if(total_unviewed > 0){
			let $link = $("#navigation-menu a[href^=\\/user\\/]");
			let $tip = $link.find(".tip-holder");

			if($tip.length == 0){
				$tip = this.create_tip();
				$link.append($tip);
			}

			let $tip_number = $tip.find(".tip-number");
			let total = total_unviewed;

			if($tip_number.html().match(/(.+?)/)){
				total += parseInt(RegExp.$1.replace(/\D/g, ""), 10);
			}

			$tip_number.html(Shared_Notifications.number_format(total));

			if(Shared_Notifications.ROUTE.name == "show_user_notifications"){
				this.mark_all_viewed();
			}
		}
	}

	static display_list(){
		if(this.notifications && this.notifications.length > 0){
			let $container = this.create_container();
			let $table = this.create_table();

			$table.append(this.create_tbody());

			$container.append($table);

			let $load_more = this.create_load_more();

			if($load_more){
				$container.append($load_more);
			}

			let $existing_box = $(".show-user").find("div.content-box");

			if($existing_box.length > 0){
				$container.insertBefore($existing_box);

				this.create_entries(Shared_Notifications.SETTINGS.show);
			}
		}
	}

	static create_tip(){
		return $("<div class='tip-holder'><div class='tip-number'></div><span class='tip'></span></div>").on("click", (evt) => {

			location.href = "/user/" + parseInt(pb.data("user").id, 10) + "/notifications";

			evt.preventDefault();

		});

	}
	static create_container(){
		return $("<div class='content-box pd-shared-notifications'><br /></div>");
	}

	static create_table(){
		return $("<table class='notifications list'></table>");
	}

	static create_tbody(){
		return $("<tbody class='notifications-container' id='pd-shared-notifications-list'></tbody>");
	}

	static create_entries(total_to_view){
		let $tbody = $("#pd-shared-notifications-list");
		let total_count = Math.min(this.notifications.length, total_to_view);

		for(let i = 0, l = total_count; i < l; ++ i){
			let $entry = this.create_row(this.notifications[i]);

			$tbody.append($entry);
		}

		if(total_count == this.notifications.length){
			$("#pd-shared-notifications-load-more").remove();
		}
	}

	static clear_entries(){
		$("#pd-shared-notifications-list").empty();
	}

	static create_row(entry){
		let $row = $("<tr></tr>");
		let $main = $("<td class='main'></td>");
		let $time = $("<td class='time-container'></td>");
		let id = parseInt(entry.split("@@")[1], 10);

		if(!this.has_viewed(id, true)){
			$main.append($("<span class='new-icon'>new</span>)"));
		}

		$main.append(Shared_Notifications.api.parse(document.createTextNode(entry.split("@@")[0])));

		$time.html("<abbr class='o-timestamp time' data-timestamp='" + id + "' title='" + new Date(id) + "'></abbr>");

		$row.append($main);
		$row.append($time);

		return $row;
	}

	static create_load_more(){
		if(this.total_showing < this.notifications.length){
			return $("<a href='#' class='show-more' id='pd-shared-notifications-load-more'>Show More</a>").on("click", (evt) => {

				this.total_showing += 5;
				this.clear_entries();
				this.create_entries(this.total_showing);
				this.set_tab_count();

				evt.preventDefault();

			});
		}

		return null;
	}

	static has_viewed(notification_id, mark = false){
		let local_data = localStorage.getItem("pd_shared_notifications");
		let ret = false;

		if(local_data && Shared_Notifications.is_json(local_data)){
			let local = JSON.parse(local_data);

			if(Array.isArray(local) && $.inArrayLoose(notification_id, local) > -1){
				ret = true;
			}
		}

		if(!ret && mark){
			//this.mark_as_viewed(notification_id);
		}

		return ret;
	}

	static mark_as_viewed(notification_id){
		let local_data = localStorage.getItem("pd_shared_notifications");
		let local = [];

		if(local_data && Shared_Notifications.is_json(local_data)){
			local = JSON.parse(local_data);
		}

		local.push(notification_id);

		localStorage.setItem("pd_shared_notifications", JSON.stringify(local));
	}

	static set_tab_count(){
		if(this.notifications && this.notifications.length > 0){
			let $notify_anchor = $(".ui-tabMenu li").find("a[href*=notifications]");

			if($notify_anchor.length > 0){
				let total = this.get_total_unviewed_notifications();

				if(total > 0){
					if($notify_anchor.html().match(/(\((.+?)\))/)){
						let current_total = parseInt(RegExp.$2.replace(/\D/g, ""), 10);

						$notify_anchor.html($notify_anchor.html().replace(RegExp.$1, "(" + Shared_Notifications.number_format(total + current_total) + ")"));
					} else {
						$notify_anchor.append(document.createTextNode(" (" + Shared_Notifications.number_format(total) + ")"))
					}
				}
			}
		}
	}

	static get_total_unviewed_notifications(){
		let count = 0;

		for(let i = 0, l = this.notifications.length; i < l; ++ i){
			if(!this.has_viewed(parseInt(this.notifications[i].split("@@")[1], 10), false)){
				count ++;
			}
		}

		return count;
	}

	static mark_all_viewed(){
		for(let i = 0, l = this.notifications.length; i < l; ++ i){
			this.mark_as_viewed(parseInt(this.notifications[i].split("@@")[1], 10));
		}
	}

};

Shared_Notifications.api = class {

	static init(){
		this.parsers = [];
	}

	static register_parser(func){
		if(func){
			this.parsers.push(func);
		}
	}

	static parse(notification){
		for(let i = 0, l = this.parsers.length; i < l; ++ i){
			notification = this.parsers[i](notification);
		}

		return notification;
	}

	static create(){

		return {

			notification(message = ""){
				let data = message + "@@" + (+ new Date());
				let p = null;
				let key_obj = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY);

				let pruner = new Shared_Notifications.api.pruner(key_obj);

				pruner.prune([data]);

				if(pruner.pruned_data().length > 0){
					p = pruner.save();

					let pruned_data = pruner.pruned_data();
					let local_data = localStorage.getItem("pd_shared_notifications");

					if(local_data && Shared_Notifications.is_json(local_data)){
						let local = JSON.parse(local_data);

						if(Array.isArray(local)){
							let has_changes = false;

							for(let p = 0, pl = pruned_data.length; p < pl; ++ p){
								let notification_id = parseInt(pruned_data[p].split("@@")[1], 10);

								if($.inArrayLoose(notification_id, local) > -1){
									local.splice(p, 1);
									has_changes = true;
								}
							}

							if(has_changes){
								localStorage.setItem("pd_shared_notifications", JSON.stringify(local));
							}
						}
					}
				} else {
					let key_obj = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY);

					if(!Array.isArray(key_obj.get()) || key_obj.is_empty()){
						p = key_obj.set([data]);
					} else {
						p = key_obj.set(data, null, "push");
					}
				}

				return p;
			}
		}

	}

	static get(){

		return {

			notifications(){
				let n = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY).get();

				if(!Array.isArray(n)){
					n = [];
				}

				return n;
			}

		};
	}

	static permission(){

		return {

			can_view(){
				if(pb.data("user").is_logged_in){
					let user_id = parseInt(pb.data("user").id, 10);

					if($.inArrayLoose(user_id, Shared_Notifications.SETTINGS.members) > -1){
						return true;
					}
				}

				return false;
			}

		}
	}


};

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

/**
 * Front key pruner.
 *
 * Will prune from the front and add to the end.
 *
 * Use in combination with key pushing.  Attempt to push to the key, if it fails, prune it and save.
 */

Shared_Notifications.api.pruner = class {

	constructor(key = null){
		this.key = key;
		this._pruned_data = [];
		this.new_data = [];
	}

	/**
	 * Will initiate the pruning while trying to add new data.
	 *
	 * @param {Array} add=[] - The data to add.
	 *
	 * @return {Boolean} - Returns true if the prune was successful.
	 */

	prune(add = []){
		if(!add || !this.key){
			return false;
		}

		if(!Array.isArray(add)){
			add = [add];
		}

		let all_data = [];
		let key_data = (Array.isArray(this.key.get()))? this.key.get() : [];

		all_data = all_data.concat(key_data);
		all_data = all_data.concat(add);

		let has_pruned = false;

		if(all_data.length > 0){
			while(JSON.stringify(all_data).length >= this.key.max_space()){
				this._pruned_data.push(key_data.shift());
				all_data.shift();
				has_pruned = true;
			}
		}

		this.new_data = all_data;
		return has_pruned;
	}

	save(){
		return this.key.set(this.new_data);
	}

	/**
	 * Returns any data that was pruned.
	 *
	 * @return {Array)
	 */

	pruned_data(){
		return this._pruned_data;
	}

};

Shared_Notifications.init();