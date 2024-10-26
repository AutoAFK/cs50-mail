document.addEventListener("DOMContentLoaded", () => {
	// Use buttons to toggle between views
	document
		.querySelector("#inbox")
		.addEventListener("click", () => load_mailbox("inbox"));
	document
		.querySelector("#sent")
		.addEventListener("click", () => load_mailbox("sent"));
	document
		.querySelector("#archived")
		.addEventListener("click", () => load_mailbox("archive"));
	document.querySelector("#compose").addEventListener("click", compose_email);
	document
		.querySelector("#compose-form")
		.addEventListener("submit", (event) => {
			const recipients = document.querySelector("#compose-recipients").value;
			const subject = document.querySelector("#compose-subject").value;
			const body = document.querySelector("#compose-body").value;
			fetch("/emails", {
				method: "POST",
				body: JSON.stringify({
					recipients,
					subject,
					body,
				}),
			})
				.then((response) => response.json())
				.then((data) => {
					if ("error" in data) {
						const error_msg_container = document.createElement("div");
						error_msg_container.className =
							"mt-3 p-3 text-warning-emphasis bg-warning-subtle border border-warning-subtle rounded-3";

						error_msg_container.innerHTML = data.error;
						const error_div = document.querySelector("#error");
						error_div.innerHTML = "";
						document.querySelector("#error").appendChild(error_msg_container);
					}
				})
				.catch((error) => {
					console.log(error);
				});
			compose_email();
			event.preventDefault();
		});
	// By default, load the inbox
	load_mailbox("inbox");
});

function compose_email() {
	// Show compose view and hide other views
	document.querySelector("#emails-view").style.display = "none";
	document.querySelector("#compose-view").style.display = "block";

	// Clear out composition fields
	document.querySelector("#compose-recipients").value = "";
	document.querySelector("#compose-subject").value = "";
	document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector("#emails-view").style.display = "block";
	document.querySelector("#compose-view").style.display = "none";

	// Show the mailbox name
	document.querySelector("#emails-view").innerHTML =
		`<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

	const emails_view = document.querySelector("#emails-view");
	const add_emails = (type) => {
		fetch(`/emails/${type}`)
			.then((response) => response.json())
			.then((emails) => {
				for (const email of emails) {
					console.log(email);
					const div = document.createElement("li");
					div.className =
						"list-group-item my-2 border d-flex flex-row align-items-center";

					const email_id = document.createElement("input");
					setAttributes(email_id, { id: email.id, type: "hidden" });

					const email_sender = document.createElement("p");
					email_sender.textContent = email.sender;
					email_sender.className = "me-2 fw-bold fs-4";

					const email_subject = document.createElement("p");
					email_subject.textContent = email.subject;
					email_subject.className = "fs-5";

					const email_timestamp = document.createElement("p");
					email_timestamp.textContent = email.timestamp;
					email_timestamp.className = "ms-auto";

					div.append(email_id, email_sender, email_subject, email_timestamp);
					console.log(div);
					emails_view.append(div);
				}
			})
			.catch((error) => console.log(error));
	};
	add_emails(mailbox);
}

function setAttributes(element, attributes) {
	for (const key in attributes) {
		element.setAttribute(key, attributes[key]);
	}
}
