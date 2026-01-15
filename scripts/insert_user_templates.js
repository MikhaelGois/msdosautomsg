const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbfile = path.join(__dirname, '..', 'data', 'msdos.db');

console.log('Using DB file:', dbfile);
const db = new sqlite3.Database(dbfile);

const templates = [
  {
    name: 'Request for MFA Reset',
    text: `Dear Team,

Please reset the Multi-Factor Authentication (MFA) for the following user:
Name: mutavel
Username: mutavel
Email: mutavel

The user is unable to complete the login process due to MFA issues. Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request for Third-Party Luxottica Account',
    text: `Dear Team,

Please create a new Luxottica account for the third-party user below:
• Full Name: mutavel
• SMTP: mutavel
• Mail Group: mutavel
• Logon Script: mutavel
• License: mutavel
• External Reference or Employee ID: mutavel
• Copy Settings From: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request for New Luxottica Account',
    text: `Dear Team,

Please create a new Luxottica account for the user below:
• Full Name: mutavel
• SMTP: mutavel
• Mail Group: mutavel
• Logon Script: mutavel
• License: mutavel
• Employee ID: mutavel
• Copy Settings From: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Add Email to Distribution Group(s)',
    text: `Dear Team,

Please add the email address below to the specified group(s):
• Email Address: mutavel
• Group(s): mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Remove Email from Distribution Group(s)',
    text: `Dear Team,

Please remove the email address below from the specified group(s):
• Email Address: mutavel
• Group(s): mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Delete Email Account',
    text: `Dear Team,

Please delete the email account below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Modify Existing Luxottica Account',
    text: `Dear Team,

Please update the Luxottica account with the details below:
• Email Address: mutavel
• Changes Required: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Modify Account by Mirroring Existing User',
    text: `Dear Team,

Please update the Luxottica account below to mirror the settings of another user:
• Email Address to Modify: mutavel
• Mirror Settings From: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Reactivate Email Account',
    text: `Dear Team,

Please reactivate the email account below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Reason for Reactivation: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'User Not Receiving Third-Party Emails',
    text: `Dear Team,

Please check and resolve the issue below:
• Email Address: mutavel
• Description of Issue: mutavel
• Steps Already Taken: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Upgrade Office License from E1 to E3',
    text: `Dear Team,

Please upgrade the Office license for the user below:
• Email Address: mutavel
• Current License: mutavel
• New License: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Renew Expired Office License (E3)',
    text: `Dear Team,

The Office license for the user below has expired. Please proceed with the renewal or reactivation:
• Email Address: mutavel
• Previous License: mutavel
• Status: Expired
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Unlock User Account',
    text: `Dear Team,

Please unlock the account for the user below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Domain Group: mutavel
• Reason for Unlock: mutavel
• Ticket BR: mutavel

Let me know if you need any additional details to process this request.

Thank you for your assistance.`
  },
  {
    name: 'Request to Block and Deactivate User Access',
    text: `Dear Team,

Please proceed with blocking and deactivating all access for the user below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Domain Group(s): mutavel
• Reason: mutavel
• Ticket BR: mutavel

Ensure that all related accounts, permissions, and access to corporate resources are disabled.

Let me know if you need any additional details to complete this request.

Thank you for your assistance.`
  }
];

function insertTemplates(){
  db.serialize(() => {
    const insert = (t, cb) => {
      db.get('SELECT id FROM templates WHERE name = ?', [t.name], (err,row)=>{
        if(err) return cb(err);
        if(row) return cb(null, { skipped: true, name: t.name, id: row.id });
        db.run('INSERT INTO templates (name,text) VALUES (?,?)', [t.name, t.text], function(e){ if(e) return cb(e); cb(null, { inserted:true, name: t.name, id: this.lastID }); });
      });
    };

    (function next(i){
      if(i>=templates.length){
        console.log('Done inserting templates.');
        db.close();
        return;
      }
      insert(templates[i], (err,res)=>{
        if(err) console.error('Error inserting', templates[i].name, err.message);
        else if(res.skipped) console.log('Skipped (exists):', res.name, 'id=', res.id);
        else console.log('Inserted:', res.name, 'id=', res.id);
        next(i+1);
      });
    })(0);

  });
}

insertTemplates();
