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