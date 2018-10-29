"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Shared_Notifications = function () {
	function Shared_Notifications() {
		_classCallCheck(this, Shared_Notifications);
	}

	_createClass(Shared_Notifications, null, [{
		key: "init",
		value: function init() {
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

			if (this.can_view) {
				Shared_Notifications_Display.init();
			}

			$(this.ready.bind(this));
		}
	}, {
		key: "ready",
		value: function ready() {
			if (this.can_view) {
				if (this.ROUTE.name == "show_user_notifications") {
					Shared_Notifications_Display.display_list();
				}

				if (this.ROUTE.name.match(/^show_user_/i) || this.ROUTE.name == "user") {
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
	}, {
		key: "setup",
		value: function setup() {
			var plugin = pb.plugin.get(this.PLUGIN_ID);

			if (plugin && plugin.settings) {
				this.PLUGIN = plugin;
				this.SETTINGS = plugin.settings;

				if (plugin.images) {
					this.IMAGES = plugin.images;
				}
			}
		}
	}, {
		key: "setup_data",
		value: function setup_data() {
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
	}, {
		key: "html_encode",
		value: function html_encode() {
			var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var decode_first = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			str = decode_first ? this.html_decode(str) : str;

			return $("<div />").text(str).html();
		}
	}, {
		key: "html_decode",
		value: function html_decode() {
			var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

			this._textarea.innerHTML = str;

			var val = this._textarea.value;

			this._textarea.innerHTML = "";

			return val;
		}
	}, {
		key: "is_json",
		value: function is_json() {
			var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var return_obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			try {
				str = JSON.parse(str);
			} catch (e) {
				return false;
			}

			if (return_obj) {
				return str;
			}

			return true;
		}
	}, {
		key: "number_format",
		value: function number_format() {
			var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var delim = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ",";

			return str.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delim) || "0";
		}
	}]);

	return Shared_Notifications;
}();

var Shared_Notifications_Display = function () {
	function Shared_Notifications_Display() {
		_classCallCheck(this, Shared_Notifications_Display);
	}

	_createClass(Shared_Notifications_Display, null, [{
		key: "init",
		value: function init() {
			this.total_showing = parseInt(Shared_Notifications.SETTINGS.show, 10);
			this.notifications = Shared_Notifications.api.get().notifications().slice().reverse();
		}
	}, {
		key: "display_tip",
		value: function display_tip() {
			var total_unviewed = this.get_total_unviewed_notifications();

			if (total_unviewed > 0) {
				var $link = $("#navigation-menu a[href^=\\/user\\/]");
				var $tip = $link.find(".tip-holder");

				if ($tip.length == 0) {
					$tip = this.create_tip();
					$link.append($tip);
				}

				var $tip_number = $tip.find(".tip-number");
				var total = total_unviewed;

				if ($tip_number.html().match(/(.+?)/)) {
					total += parseInt(RegExp.$1.replace(/\D/g, ""), 10);
				}

				$tip_number.html(Shared_Notifications.number_format(total));

				if (Shared_Notifications.ROUTE.name == "show_user_notifications") {
					this.mark_all_viewed();
				}
			}
		}
	}, {
		key: "display_list",
		value: function display_list() {
			if (this.notifications && this.notifications.length > 0) {
				var $container = this.create_container();
				var $table = this.create_table();

				$table.append(this.create_tbody());

				$container.append($table);

				var $load_more = this.create_load_more();

				if ($load_more) {
					$container.append($load_more);
				}

				var $existing_box = $(".show-user").find("div.content-box");

				if ($existing_box.length > 0) {
					$container.insertBefore($existing_box);

					this.create_entries(Shared_Notifications.SETTINGS.show);
				}
			}
		}
	}, {
		key: "create_tip",
		value: function create_tip() {
			return $("<div class='tip-holder'><div class='tip-number'></div><span class='tip'></span></div>").on("click", function (evt) {

				location.href = "/user/" + parseInt(pb.data("user").id, 10) + "/notifications";

				evt.preventDefault();
			});
		}
	}, {
		key: "create_container",
		value: function create_container() {
			return $("<div class='content-box pd-shared-notifications'><br /></div>");
		}
	}, {
		key: "create_table",
		value: function create_table() {
			return $("<table class='notifications list'></table>");
		}
	}, {
		key: "create_tbody",
		value: function create_tbody() {
			return $("<tbody class='notifications-container' id='pd-shared-notifications-list'></tbody>");
		}
	}, {
		key: "create_entries",
		value: function create_entries(total_to_view) {
			var $tbody = $("#pd-shared-notifications-list");
			var total_count = Math.min(this.notifications.length, total_to_view);

			for (var i = 0, l = total_count; i < l; ++i) {
				var $entry = this.create_row(this.notifications[i]);

				$tbody.append($entry);
			}

			if (total_count == this.notifications.length) {
				$("#pd-shared-notifications-load-more").remove();
			}
		}
	}, {
		key: "clear_entries",
		value: function clear_entries() {
			$("#pd-shared-notifications-list").empty();
		}
	}, {
		key: "create_row",
		value: function create_row(entry) {
			var $row = $("<tr></tr>");
			var $main = $("<td class='main'></td>");
			var $time = $("<td class='time-container'></td>");
			var id = parseInt(entry.split("@@")[1], 10);

			if (!this.has_viewed(id, true)) {
				$main.append($("<span class='new-icon'>new</span>)"));
			}

			$main.append(Shared_Notifications.api.parse(document.createTextNode(entry.split("@@")[0])));

			$time.html("<abbr class='o-timestamp time' data-timestamp='" + id + "' title='" + new Date(id) + "'></abbr>");

			$row.append($main);
			$row.append($time);

			return $row;
		}
	}, {
		key: "create_load_more",
		value: function create_load_more() {
			var _this = this;

			if (this.total_showing < this.notifications.length) {
				return $("<a href='#' class='show-more' id='pd-shared-notifications-load-more'>Show More</a>").on("click", function (evt) {

					_this.total_showing += 5;
					_this.clear_entries();
					_this.create_entries(_this.total_showing);
					_this.set_tab_count();

					evt.preventDefault();
				});
			}

			return null;
		}
	}, {
		key: "has_viewed",
		value: function has_viewed(notification_id) {
			var mark = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			var local_data = localStorage.getItem("pd_shared_notifications");
			var ret = false;

			if (local_data && Shared_Notifications.is_json(local_data)) {
				var local = JSON.parse(local_data);

				if (Array.isArray(local) && $.inArrayLoose(notification_id, local) > -1) {
					ret = true;
				}
			}

			if (!ret && mark) {
				//this.mark_as_viewed(notification_id);
			}

			return ret;
		}
	}, {
		key: "mark_as_viewed",
		value: function mark_as_viewed(notification_id) {
			var local_data = localStorage.getItem("pd_shared_notifications");
			var local = [];

			if (local_data && Shared_Notifications.is_json(local_data)) {
				local = JSON.parse(local_data);
			}

			local.push(notification_id);

			localStorage.setItem("pd_shared_notifications", JSON.stringify(local));
		}
	}, {
		key: "set_tab_count",
		value: function set_tab_count() {
			if (this.notifications && this.notifications.length > 0) {
				var $notify_anchor = $(".ui-tabMenu li").find("a[href*=notifications]");

				if ($notify_anchor.length > 0) {
					var total = this.get_total_unviewed_notifications();

					if (total > 0) {
						if ($notify_anchor.html().match(/(\((.+?)\))/)) {
							var current_total = parseInt(RegExp.$2.replace(/\D/g, ""), 10);

							$notify_anchor.html($notify_anchor.html().replace(RegExp.$1, "(" + Shared_Notifications.number_format(total + current_total) + ")"));
						} else {
							$notify_anchor.append(document.createTextNode(" (" + Shared_Notifications.number_format(total) + ")"));
						}
					}
				}
			}
		}
	}, {
		key: "get_total_unviewed_notifications",
		value: function get_total_unviewed_notifications() {
			var count = 0;

			for (var i = 0, l = this.notifications.length; i < l; ++i) {
				if (!this.has_viewed(parseInt(this.notifications[i].split("@@")[1], 10), false)) {
					count++;
				}
			}

			return count;
		}
	}, {
		key: "mark_all_viewed",
		value: function mark_all_viewed() {
			for (var i = 0, l = this.notifications.length; i < l; ++i) {
				this.mark_as_viewed(parseInt(this.notifications[i].split("@@")[1], 10));
			}
		}
	}]);

	return Shared_Notifications_Display;
}();

;

Shared_Notifications.api = function () {
	function _class() {
		_classCallCheck(this, _class);
	}

	_createClass(_class, null, [{
		key: "init",
		value: function init() {
			this.parsers = [];
		}
	}, {
		key: "register_parser",
		value: function register_parser(func) {
			if (func) {
				this.parsers.push(func);
			}
		}
	}, {
		key: "parse",
		value: function parse(notification) {
			for (var i = 0, l = this.parsers.length; i < l; ++i) {
				notification = this.parsers[i](notification);
			}

			return notification;
		}
	}, {
		key: "create",
		value: function create() {

			return {
				notification: function notification() {
					var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

					var data = message + "@@" + +new Date();
					var p = null;
					var key_obj = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY);

					var pruner = new Shared_Notifications.api.pruner(key_obj);

					pruner.prune([data]);

					if (pruner.pruned_data().length > 0) {
						p = pruner.save();

						var pruned_data = pruner.pruned_data();
						var local_data = localStorage.getItem("pd_shared_notifications");

						if (local_data && Shared_Notifications.is_json(local_data)) {
							var local = JSON.parse(local_data);

							if (Array.isArray(local)) {
								var has_changes = false;

								for (var _p = 0, pl = pruned_data.length; _p < pl; ++_p) {
									var notification_id = parseInt(pruned_data[_p].split("@@")[1], 10);

									if ($.inArrayLoose(notification_id, local) > -1) {
										local.splice(_p, 1);
										has_changes = true;
									}
								}

								if (has_changes) {
									localStorage.setItem("pd_shared_notifications", JSON.stringify(local));
								}
							}
						}
					} else {
						var _key_obj = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY);

						if (!Array.isArray(_key_obj.get()) || _key_obj.is_empty()) {
							p = _key_obj.set([data]);
						} else {
							p = _key_obj.set(data, null, "push");
						}
					}

					return p;
				}
			};
		}
	}, {
		key: "get",
		value: function get() {

			return {
				notifications: function notifications() {
					var n = Shared_Notifications.api.key(Shared_Notifications.PLUGIN_KEY).get();

					if (!Array.isArray(n)) {
						n = [];
					}

					return n;
				}
			};
		}
	}, {
		key: "permission",
		value: function permission() {

			return {
				can_view: function can_view() {
					if (pb.data("user").is_logged_in) {
						var user_id = parseInt(pb.data("user").id, 10);

						if ($.inArrayLoose(user_id, Shared_Notifications.SETTINGS.members) > -1) {
							return true;
						}
					}

					return false;
				}
			};
		}
	}]);

	return _class;
}();

Shared_Notifications.api.key = function () {
	function _class2() {
		_classCallCheck(this, _class2);
	}

	_createClass(_class2, null, [{
		key: "init",
		value: function init() {
			this.pb_key_obj = pb.plugin.key;

			return this.wrapper.bind(this);
		}

		/**
   * @ignore
   */

	}, {
		key: "wrapper",
		value: function wrapper() {
			var _this2 = this;

			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

			return Object.assign(Object.create(null), {

				exists: function exists() {
					return _this2.exists(key);
				},
				obj: function obj() {
					return _this2.key_obj(key);
				},
				is_empty: function is_empty(object_id) {
					return _this2.is_empty(key, object_id);
				},
				has_value: function has_value(object_id) {
					return !_this2.is_empty(key, object_id);
				},
				get: function get(object_id, is_json) {
					return _this2.get(key, object_id);
				},
				clear: function clear(object_id) {
					return _this2.clear(key, object_id);
				},
				set: function set(value, object_id, type) {
					return _this2.set(key, value, object_id, type);
				},
				on: function on(evt, value, object_id) {
					return _this2.on(key, evt, value, object_id);
				},
				push: function push(value, object_id) {
					return _this2.push(key, value, object_id);
				},
				type: function type(object_id, return_str) {
					return _this2.type(key, return_str);
				},
				len: function len(object_id) {
					return _this2.len(key, object_id);
				},
				super_forum_key: function super_forum_key() {
					return _this2.super_forum_key(key);
				},
				has_space: function has_space(object_id) {
					return _this2.has_space(key, object_id);
				},
				space_left: function space_left(object_id) {
					return _this2.space_left(key, object_id);
				},
				max_space: function max_space() {
					return _this2.max_space(key);
				}

			});
		}

		/**
   * Checks to see if a key exists.
   *
   * @param {String} key="" - The key to check.
   *
   * @return {Boolean}
   */

	}, {
		key: "exists",
		value: function exists() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

			if (key) {
				if (typeof proboards.plugin._keys[key] != "undefined") {
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

	}, {
		key: "key_obj",
		value: function key_obj() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

			if (this.exists(key)) {
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

	}, {
		key: "is_empty",
		value: function is_empty() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var object_id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			if (this.exists(key)) {
				if (typeof this.pb_key_obj(key).get != "undefined") {
					var val = this.pb_key_obj(key).get(object_id || undefined) || "";

					if (val.toString().length > 0 || JSON.stringify(val).length > 2) {
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

	}, {
		key: "get",
		value: function get() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var object_id = arguments[1];
			var is_json = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

			if (this.exists(key)) {
				object_id = object_id || undefined;

				if (!this.is_empty(key, object_id)) {
					var value = this.pb_key_obj(key).get(object_id);

					if (is_json && Shared_Notifications.is_json(value)) {
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

	}, {
		key: "clear",
		value: function clear() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var object_id = arguments[1];

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

	}, {
		key: "set",
		value: function set() {
			var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
			var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

			var _this3 = this;

			var object_id = arguments[2];
			var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";

			var p = new Promise(function (resolve, reject) {
				object_id = object_id || undefined;

				if (_this3.exists(key)) {
					var options = {

						object_id: object_id,
						value: value

					};

					options.error = function (status) {
						reject(status);
					};

					options.success = function (status) {
						resolve(status);
					};

					if (type) {
						switch (type) {

							case "push":
							case "unshift":

								if (Array.isArray(options.value) && options.value.length > 1) {
									options.values = options.value;
									delete options.value;
								}

								break;

							case "pop":
							case "shift":

								if (options.value) {
									options.num_items = ~~options.value;
									delete options.value;
								}

								break;
						}

						_this3.pb_key_obj(key)[type](options);
					} else {
						_this3.pb_key_obj(key).set(options);
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

	}, {
		key: "on",
		value: function on(key) {
			var event = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
			var value = arguments[2];
			var object_id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

			if (!event) {
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

	}, {
		key: "push",
		value: function push(key, value, object_id) {
			value = Array.isArray(value) && value.length == 1 ? value[0] : value;

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

	}, {
		key: "type",
		value: function type(key) {
			var return_str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			var type = this.pb_key_obj(key).type();

			if (return_str) {
				var types = pb.plugin.key_types();

				for (var k in types) {
					if (types[k] == type) {
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

	}, {
		key: "len",
		value: function len(key, object_id) {
			var val = this.get(key, object_id);

			if (typeof val == "string") {
				return val.length;
			}

			return typeof val === "undefined" ? 0 : JSON.stringify(val).length;
		}

		/**
   * Checks to see if the key is a super_forum type.
   *
   * @param {String} key - The key to check.
   *
   * @return {Boolean}
   */

	}, {
		key: "super_forum_key",
		value: function super_forum_key(key) {
			if (this.type(key) == 7) {
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

	}, {
		key: "has_space",
		value: function has_space(key, object_id) {
			var max_length = this.super_forum_key(key) ? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");

			if (this.len(key, object_id) < max_length) {
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

	}, {
		key: "space_left",
		value: function space_left(key, object_id) {
			var max_length = this.super_forum_key(key) ? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");
			var key_length = this.len(key, object_id);
			var space_left = max_length - key_length;

			return space_left < 0 ? 0 : space_left;
		}

		/**
   * Gets max space (characters).
   *
   * @param {String} key - The key to check.
   *
   * @return {Number}
   */

	}, {
		key: "max_space",
		value: function max_space(key) {
			var max_length = this.super_forum_key(key) ? pb.data("plugin_max_super_forum_key_length") : pb.data("plugin_max_key_length");

			return max_length - 2;
		}
	}]);

	return _class2;
}();

Shared_Notifications.api.key = Shared_Notifications.api.key.init();

/**
 * Front key pruner.
 *
 * Will prune from the front and add to the end.
 *
 * Use in combination with key pushing.  Attempt to push to the key, if it fails, prune it and save.
 */

Shared_Notifications.api.pruner = function () {
	function _class3() {
		var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

		_classCallCheck(this, _class3);

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

	_createClass(_class3, [{
		key: "prune",
		value: function prune() {
			var add = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

			if (!add || !this.key) {
				return false;
			}

			if (!Array.isArray(add)) {
				add = [add];
			}

			var all_data = [];
			var key_data = Array.isArray(this.key.get()) ? this.key.get() : [];

			all_data = all_data.concat(key_data);
			all_data = all_data.concat(add);

			var has_pruned = false;

			if (all_data.length > 0) {
				while (JSON.stringify(all_data).length >= this.key.max_space()) {
					this._pruned_data.push(key_data.shift());
					all_data.shift();
					has_pruned = true;
				}
			}

			this.new_data = all_data;
			return has_pruned;
		}
	}, {
		key: "save",
		value: function save() {
			return this.key.set(this.new_data);
		}

		/**
   * Returns any data that was pruned.
   *
   * @return {Array)
   */

	}, {
		key: "pruned_data",
		value: function pruned_data() {
			return this._pruned_data;
		}
	}]);

	return _class3;
}();


Shared_Notifications.init();