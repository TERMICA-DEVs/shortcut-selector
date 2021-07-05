(function($, window, undefined, Event) {

  const PLUGINNAME = 'ShortcutSelector';

  var g_all_shortcuts = [];

  function globalKeyboardEvent(event) {
    for(let shortcut of g_all_shortcuts) {
      if(shortcut.shortcutMatch(event)) {
        shortcut.node.dispatchEvent(new Event('shortcut-selector-keypress'));
        event.stopPropagation();
        event.preventDefault();
      }
    }
  }

  class ShortcutSelector {
    constructor(node, options) {
      this.node = node;

      this.options = options || {};

      this.compare_code = !!this.options.compare_code;
      this.compare_key = this.options.compare_key === undefined || !!this.options.compare_key;

      if(this.options.intercept_event === true) {
        g_all_shortcuts.push(this);
      }

      if(this.options.shortcut) {
        setShortcut(this.options.shortcut);
      }
      else {
        this.shortcut = undefined;
      }

      this.keyDown = this.keyDown.bind(this);
      this.keyUp = this.keyUp.bind(this);

      node.innerHTML = `
        <span style="display: block; text-overflow: ellipsis;
                     box-sizing: border-box; overflow: hidden;
                     white-space: nowrap;">
          &nbsp;
        </span>
      `;

      this.waiting_key = false;

      node.addEventListener('click', () => {
        this.waiting_key = true;
        node.classList.add('shortcut-selector-waiting');

        if(g_all_shortcuts.length !== 0) {
          window.removeEventListener('keydown', globalKeyboardEvent);
        }
        window.addEventListener('keydown', this.keyDown);
        window.addEventListener('keyup', this.keyUp);
      });
    }

    shortcutMatch(event) {

      if(this.waiting_key) {
        return false;
      }

      const shortcut = this.shortcut;

      if(!shortcut) return;

      if(this.compare_code && shortcut.code !== event.code) return;
      if(this.compare_key && shortcut.key !== event.key) return;
      if(shortcut.shift !== event.shiftKey) return;
      if(shortcut.ctrl !== event.ctrlKey) return;
      if(shortcut.alt !== event.altKey) return;

      return shortcut.meta === event.metaKey;
    }

    getShortcut() {
      return this.shortcut;
    }

    setShortcut(shortcut) {

      const node_text = this.node.querySelector('span');

      if(!shortcut) {
          this.shortcut = null;
          node_text.innerHTML = '&nbsp;';
          return;
      }

      let name = '';

      if(shortcut.shift) {
          name = 'Shift + ';
      }

      if(shortcut.ctrl) {
          name += 'Ctrl + ';
      }

      if(shortcut.alt) {
          name += 'Alt + ';
      }

      if(shortcut.meta) {
          name += 'Meta + ';
      }
      const key_text = shortcut.code === 'Space'
        ? 'Space'
        : shortcut.key.length === 1
          ? shortcut.key.toUpperCase()
          : shortcut.key;

      node_text.innerHTML = name + key_text;

      this.shortcut = shortcut;

      if(g_all_shortcuts.length !== 0) {
        window.addEventListener('keydown', globalKeyboardEvent);
      }
    }

    keyDown(event) {

      const key = event.key;

      if(event.code === 'Escape') {
        this.setShortcut(null);
      }
      else {

        const invalid_keys = [
          'Shift', 'Control', 'Meta', 'Alt', 'AltGraph', 'CapsLock'
        ];
        if(key.length > 2 && invalid_keys.includes(key)) {
          return;
        }

        this.setShortcut({
          key: key,
          code: event.code,
          shift: event.shiftKey,
          ctrl: event.ctrlKey,
          alt: event.altKey,
          meta: event.metaKey
        });
      }

      window.removeEventListener('keydown', this.keyDown);

      this.waiting_key = false;

      this.node.classList.remove('shortcut-selector-waiting');

      event.stopPropagation();
      event.preventDefault();
    }

    keyUp(event) {
      if(!this.waiting_key) {
        window.removeEventListener('keyup', this.keyUp);
      }

      event.stopPropagation();
      event.preventDefault();
    }
  }

  $.fn[PLUGINNAME] = function(option) {

    const args = arguments;

    let called_method = false;
    let result;
    this.each(function() {
      const $this = $(this);
      let data = $.data(this, 'plugin_' + PLUGINNAME);
      const options = typeof option === 'object' && option;
      if(!data) {
        $this.data('plugin_' + PLUGINNAME, (data = new ShortcutSelector(this, options)));
      }
      if(typeof option === 'string') {
        result = data[option].apply(data, Array.prototype.slice.call(args, 1));
        called_method = true;
      }
    });

    return called_method
      ? result
      : this;
  };

}(jQuery, window, undefined, Event));
