document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('none'));
  document.querySelector('#compose-view').addEventListener('submit', sendEmail)
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(details) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none'

  // Clear out composition fields
  if (details === 'none'){
     document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    document.querySelector('#compose-recipients').value = `${details['recipient']}`;
    document.querySelector('#compose-subject').value = `${details['subjectline']}`;

    document.querySelector('#compose-body').value = `
    
    
    
    ---------------------------------------------------------------------------
    On ${details['timestamp']} ${details['recipient']} wrote: 

    ${details['body']}`;
  }

}

function sendEmail(event) {
    event.preventDefault()
    fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => load_mailbox('sent'));
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none'

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

   fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(email => {
      const emailView = document.getElementById('emails-view')
      if (mailbox === 'inbox') {
        for (let i = 0; i < email.length; i++) {
          const emailDiv = document.createElement('div')
          emailDiv.classList.add('email-div')

          if (email[i]['read'] === false) {
            emailDiv.style.background = "white";
          } else {
            emailDiv.style.background = "#F5F5F5";
          }
          const htmlContent = `<span class="sender">${email[i]['sender']}</span> <p class="subject">${email[i]['subject']}</p>
                                <p class="timestamp">${email[i]['timestamp']}</p>`
          emailDiv.innerHTML = htmlContent
          emailDiv.addEventListener('click', function() {
            showEmail(email[i]['id'], 'inbox')
          })
          emailView.append(emailDiv)
        }
      } else if (mailbox === 'sent') {
        for (let i = 0; i < email.length; i++) {
          const emailDiv = document.createElement('div')
          emailDiv.classList.add('email-div')

    
          emailDiv.style.background = "white";
          
          const htmlContent = `<span class="sender">${email[i]['recipients']}</span> <p class="subject">${email[i]['subject']}</p>
                                <p class="timestamp">${email[i]['timestamp']}</p>`
          emailDiv.innerHTML = htmlContent
  
          emailDiv.addEventListener('click', function() {
            showEmail(email[i]['id'], 'sent')
          })
          emailView.append(emailDiv)
        }
      } else if (mailbox === 'archive') {
        for (let i = 0; i < email.length; i++) {
          const emailDiv = document.createElement('div')
          emailDiv.classList.add('email-div')

    
          emailDiv.style.background = "#F5F5F5";
          
          const htmlContent = `<span class="sender">${email[i]['recipients']}</span> <p class="subject">${email[i]['subject']}</p>
                                <p class="timestamp">${email[i]['timestamp']}</p>`
          emailDiv.innerHTML = htmlContent
          emailDiv.addEventListener('click', function() {
            showEmail(email[i]['id'], 'archive')
          })
          emailView.append(emailDiv)
        }
      }
    })
}

function showEmail(email_id, type) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block'

  fetch(`/emails/${email_id}`, {
  method: 'PUT',
  body: JSON.stringify({
      read: true
  })
  })


  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const emailDiv = document.getElementById('email-view')
    archive_status = "Archive"
    if (email['archived'] === true) {
      archive_status = "Archived"
    }
    const htmlContent = `<button id="goback-btn" class="btn btn-sm btn-outline-primary">Go back</button>
                        <span class="email-subjectline">${email['subject']}</span>
                         <span class="email-sender">From: ${email['sender']}</span>
                         <span class="email-receiver">to: ${email['recipients']}</span>
                         <span class="email-timestamp">on: ${email['timestamp']}</span>
                         <button id="reply-btn" class="btn btn-sm btn-outline-primary">Reply</button>
                         <button id="archive-btn" class="btn btn-sm btn-outline-primary">${archive_status}</button>
                         <hr>
                         <p class="email-body">${email['body']}</p>`
                      
    emailDiv.innerHTML = htmlContent
    if (type === 'sent') {
      document.getElementById('archive-btn').style.display = "none";
    }
    document.getElementById('goback-btn').addEventListener('click', function() {
      load_mailbox('inbox')
    })
    document.getElementById('archive-btn').addEventListener('click', function() {
      if (archive_status === 'Archive') {
          fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
          archived: true
         })
      })
      .then(response => load_mailbox('inbox'))
    } else {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
          archived: false
         })
      })
      .then(response => load_mailbox('inbox'))
      }
    })
    document.getElementById('reply-btn').addEventListener('click', function() {
      if (email['subject'].slice(0, 3) === 'Re:') {
        subjectline = email['subject']
      } else {
        subjectline = "Re: " + email['subject'] 
      }
      dict = {
        "recipient": email['sender'],
        "subjectline": subjectline, 
        "timestamp": email['timestamp'],
        "body": email['body']
      }
      compose_email(dict)
    })
  })
}
