class Shared_Notifications_Display {

	static init(){
		this.total_showing = parseInt(Shared_Notifications.SETTINGS.show, 10);
		this.notifications = Shared_Notifications.api.get.notifications().slice().reverse();
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