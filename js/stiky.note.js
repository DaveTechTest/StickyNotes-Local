/** 
 * A sticky note object based on one of the webkit 
 * samples and highly re-factored to use local storage 
 * instead of Web SQL (compatible with Firefox and IE)
 * 
 * Addition abd re-factoring: Davis Desormeaux
 * License: WebKit is open source software with portions licensed under the LGPL and BSD licenses. 
 *
 **/

var ns = "StickyNote", 
    db = utils.storage;

db.init(ns, true);
//db.clear(); // Fix for Firefox when changing namespace (ns)...

var captured = null,
    highestZ = 0,
    highestId = 0,
    currentUser = "";

function Note() {
  
  var self = this;
  
  var note = document.createElement('div');
  note.className = 'note';
  note.addEventListener('mousedown', function(e) { return self.onMouseDown(e) }, false);
  note.addEventListener('click', function() { return self.onNoteClick() }, false);
  this.note = note;

  var close = document.createElement('div');
  close.className = 'closebutton';
  close.addEventListener('click', function(event) { return self.close(event) }, false);
  note.appendChild(close);
    
  var edit = document.createElement('div');
  edit.className = 'edit';
  edit.setAttribute('contenteditable', true);
  edit.addEventListener('keyup', function() { return self.onKeyUp() }, false);
  note.appendChild(edit);
  this.editField = edit;

  var ts = document.createElement('div');
  ts.className = 'timestamp';
  ts.addEventListener('mousedown', function(e) { return self.onMouseDown(e) }, false);
  note.appendChild(ts);
  this.lastModified = ts;

  document.body.appendChild(note);
  return this;
}

Note.prototype = {
 
  get id() {
    if (!("_id" in this)) this._id = 0;
    return this._id;
  },

  set id(x) {
    this._id = x;
  },

  get text() {
    return this.editField.innerHTML;
  },

  set text(x) {
    this.editField.innerHTML = x;
  },

  get timestamp() {
    if (!("_timestamp" in this)) this._timestamp = 0;
    return this._timestamp;
  },

  set timestamp(x) {
    if (this._timestamp == x) return;
    this._timestamp = x;
    var date = new Date();
    date.setTime(parseFloat(x));
    this.lastModified.textContent = modifiedString(date);
  },


  getLeft: function() {
    return this.note.style.left;
  },

  setLeft: function(x) {
    this.note.style.left = x;
  },

  getTop: function() {
    return this.note.style.top;
  },

  setTop: function(x) {
    this.note.style.top = x;
  },

  get zIndex() {
    return this.note.style.zIndex;
  },

  set zIndex(x) {
    this.note.style.zIndex = x;
  },
    
  close: function(event) {
    this.cancelPendingSave();
    var note = this;
    db.remove(note.id);
    var duration = .25
    var self = this;
    setTimeout(function() { document.body.removeChild(self.note) }, duration * 1000);
  },

  saveSoon: function() {
    this.cancelPendingSave();
    var self = this;
    this._saveTimer = setTimeout(function() { self.save() }, 200);
  },

  cancelPendingSave: function() {
    if (!("_saveTimer" in this)) return;
    clearTimeout(this._saveTimer);
    delete this._saveTimer;
  },

  save: function() {
    this.cancelPendingSave();

    if ("dirty" in this) {
      this.timestamp = new Date().getTime();
      delete this.dirty;
    }

    var note = this;
    
    if( db.exists(note.id) ) {
      var newNote = db.read(note.id);
      newNote.id   = note.id;
      newNote.top  = note.top;
      newNote.left = note.left;
      newNote.text = note.text
      newNote.timestamp = note.timestamp;
      var noteToSave = { id: newNote.id, username: newNote.username, left: newNote.left, top: newNote.top, zIndex: note.zIndex, text: newNote.text, timestamp: newNote.timestamp }
      db.save(newNote.id, newNote);
      // console.log(newNote);
    }
  },

  saveAsNew: function() {
    this.timestamp = new Date().getTime();
    var note = this;
    // console.log(note);
    var noteToSave = { id: note.id, username: note.username, left: note.left, top: note.top, zIndex: note.zIndex, text: '', timestamp: note.timestamp }
    db.save(note.id, noteToSave);
  },

  onMouseDown: function(e) {
    captured = this;
    this.startX = e.clientX - this.note.offsetLeft;
    this.startY = e.clientY - this.note.offsetTop;
    this.zIndex = ++highestZ;

    var self = this;
    if (!("mouseMoveHandler" in this)) {
      this.mouseMoveHandler = function(e) { return self.onMouseMove(e) }
      this.mouseUpHandler = function(e) { return self.onMouseUp(e) }
    }

    document.addEventListener('mousemove', this.mouseMoveHandler, true);
    document.addEventListener('mouseup', this.mouseUpHandler, true);

    return false;
  },

  onMouseMove: function(e) {
    if (this != captured) return true;

    this.left = e.clientX - this.startX + 'px';
    this.top = e.clientY - this.startY + 'px';

    this.setLeft(this.left);
    this.setTop(this.top);
    return false;
      
  },

  onMouseUp: function(e) {
    document.removeEventListener('mousemove', this.mouseMoveHandler, true);
    document.removeEventListener('mouseup', this.mouseUpHandler, true);

    this.save();
    return false;
  },

  onNoteClick: function(e) {
    this.editField.focus();
    getSelection().collapseToEnd();
  },

  onKeyUp: function() {
    this.dirty = true;
    this.saveSoon();
  },
}

/**
 * Fetch notes assigned to username
 */
function loadNotes(username) {
  var localStorageKeys = Object.keys(localStorage);
  for (var i=0; i<localStorageKeys.length; i++) {
    var currKey = localStorageKeys[i].replace(ns + '_', "") // StickyNote_123 => 123
    if( db.exists(currKey)) {
      var currNote = db.read(currKey);
      if (currNote.id > highestId) highestId = currNote.id;
      if (currNote.zindex > highestZ) highestZ = currNote.zindex;		
      if(currNote.username != currentUser) continue; // Skip this note (not assigned to user)
      var note = new Note();
      note.id = currNote.id;
      note.text = currNote.text;
      note.timestamp =currNote.timestamp;
      note.left = currNote.left;
      note.top = currNote.top;
      note.zIndex = currNote.zindex;
      note.setLeft(note.left);
      note.setTop(note.top);
	
    }
  }
}

function modifiedString(date) {
  return 'Last Modified: ' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

function newNote() {
  var note = new Note();
  note.id = ++highestId;
  note.timestamp = new Date().getTime();
  note.left = Math.round(Math.random() * 400) + 'px';
  note.top = Math.round(Math.random() * 500) + 'px';
  note.zIndex = ++highestZ;
  note.username = currentUser;
  note.saveAsNew();
}
