import { Rubocop } from './rubocop';

export class RubocopAutocorrect extends Rubocop {
    public get isOnSave(): boolean {
        return false;
    }

    protected commandArguments(fileName: string): Array<string> {
        return super.commandArguments(fileName).concat(['--auto-correct']);
    }
}
