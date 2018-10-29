class Shared_Notifications {

	static init(){
		this.VERSION = "{VER}";

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