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