# Reactive Architecture

- Message
  - Dispatched by system
  - For any user interactions, scheduled events, or network request results
  - Multiple messages can be composed into a higher level message
- Command
  - Dispatched by user
  - UNIX like command with 0 or more arguments
  - Searchable via a command palette
  - A subset of commands can have keyboard shortcuts
  - The available commands are predefined at build time, but should be extendable by plugins
  - Result in predefined message being dispatched
- Keyboard shortcut
  - Given a keyboard input, and a context, execute a command without any arguments
- Message Handler
  - System defined functions that handle the message of matching type
- Modularity
  - Each component should independently register a list of Commands they can handle
  - Keyboard shortcut should instead be managed in a centralized way

## Interface

```typescript
// system defined
interface Message {
  type: string; // extendable
  data: any;
}

// system + plugin defined
interface Command {
  name: string; // Short, descriptive label for human
  syntax: string; // a template indicating how the command should be parsed
  action: (args: string) => Message;
}

// user defined
interface KeyboardShortcut {
  keygram: string; // [Ctrl-][Alt-][Shift-]<Key>
  when: string;
  command: string;
}

// Alternative design

interface CommandAlt {
  name: string; // Short, descriptive label for human
  syntax: string; // a template indicating how the command should be parsed
  messages: Message;
}

interface ShortcutAlt {
  name: string; // Short, descriptive label for human
  keygram: string; // [Ctrl-][Alt-][Shift-]<Key>
  context: string;
  command: string;
}

type MessageHandler = (type: string, data: any) => any;
```
