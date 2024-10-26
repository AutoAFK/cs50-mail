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

function compose_email(recipients, subject, timestamp_last_email, sender) {
	// Show compose view and hide other views
	document.querySelector("#emails-view").style.display = "none";
	document.querySelector("#compose-view").style.display = "block";
	document.querySelector("#email").innerHTML = "";

	// Clear out composition fields
	document.querySelector("#compose-recipients").value =
		recipients instanceof Event ? "" : recipients;
	document.querySelector("#compose-subject").value =
		recipients instanceof Event
			? ""
			: subject.includes("Re")
				? subject
				: `Re: ${subject}`;
	document.querySelector("#compose-body").value =
		recipients instanceof Event
			? ""
			: `On ${timestamp_last_email} ${sender} wrote:`;
}

function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector("#emails-view").style.display = "block";
	document.querySelector("#email").innerHTML = "";
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
					const open_email = () => {
						fetch(`/emails/${email.id}`, {
							method: "PUT",
							body: JSON.stringify({
								read: true,
							}),
						});
						emails_view.style.display = "none";

						fetch(`/emails/${email.id}`)
							.then((response) => response.json())
							.then((data) => {
								const email_container = document.querySelector("#email");
								email_container.style.display = "block";
								const container = document.createElement("div");

								const sender = document.createElement("p");
								sender.innerHTML = `<b>From:</b> ${data.sender}`;

								const recipients = document.createElement("p");
								recipients.innerHTML = `<b>To:</b> ${data.recipients}`;

								const subject = document.createElement("p");
								subject.innerHTML = `<b>Subject:</b> ${data.subject}`;

								const timestamp = document.createElement("p");
								timestamp.innerHTML = `<b>Timestamp:</b> ${data.timestamp}`;

								const reply = document.createElement("button");
								reply.onclick = () => {
									const recipients = data.sender;
									const subject = data.subject;
									const timestamp_last_email = data.timestamp;
									const sender = data.sender;
									email_container.innerHTML = "";
									compose_email(
										recipients,
										subject,
										timestamp_last_email,
										sender,
									);
								};
								reply.className = "btn btn btn-outline-primary me-2";
								reply.textContent = "Reply";

								const archive = document.createElement("button");
								archive.textContent = data.archived ? "Unarchive" : "Archive";
								archive.className = "btn btn btn-outline-primary";
								archive.onclick = () => {
									fetch(`/emails/${data.id}`, {
										method: "PUT",
										body: JSON.stringify({
											archived: !data.archived,
										}),
									}).then(() => {
										if (data.archived) {
											load_mailbox("inbox");
										} else {
											load_mailbox("archive");
										}
									});
								};

								const body = document.createElement("p");
								body.innerHTML = data.body;

								const horizontal_ruler = document.createElement("hr");

								container.append(
									sender,
									recipients,
									subject,
									timestamp,
									reply,
									archive,
									horizontal_ruler,
									body,
								);

								for (const child of container.children) {
									child.className += " mb-2";
								}

								email_container.append(container);
							});
					};

					const li = document.createElement("li");
					li.className = "list-group-item my-2 border d-flex flex-row";
					if (email.read) {
						li.className += " bg-secondary-subtle";
					}
					li.onclick = open_email;

					const email_id = document.createElement("input");
					setAttributes(email_id, { id: email.id, type: "hidden" });

					const email_sender = document.createElement("p");
					if (type === "sent") {
						email_sender.textContent = email.recipients;
					} else {
						email_sender.textContent = email.sender;
					}
					email_sender.className = "me-2 fw-bold";

					const email_subject = document.createElement("p");
					email_subject.textContent = email.subject;
					email_subject.className = "";

					const email_timestamp = document.createElement("p");
					email_timestamp.textContent = email.timestamp;
					email_timestamp.className = "ms-auto";

					li.append(email_id, email_sender, email_subject, email_timestamp);
					emails_view.append(li);
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
