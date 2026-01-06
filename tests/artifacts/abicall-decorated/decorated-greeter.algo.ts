import { abimethod, contract, Contract, GlobalState } from '@algorandfoundation/algorand-typescript'

@contract({ name: 'Greeter', avmVersion: 11 })
export class DecoratedGreeter extends Contract {
  greeting = GlobalState({ initialValue: '' })
  name = GlobalState({ initialValue: '' })

  @abimethod()
  setGreeting(greeting: string) {
    this.greeting.value = greeting
  }

  @abimethod()
  setName(name: string) {
    this.name.value = name
  }

  @abimethod()
  greet(from: string): string {
    return `${this.greeting.value}, ${this.name.value}, ${from}`
  }
}
