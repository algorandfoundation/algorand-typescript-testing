import type { Application } from '@algorandfoundation/algorand-typescript'
import { Contract, GlobalState, abimethod } from '@algorandfoundation/algorand-typescript'
import { abiCall } from '@algorandfoundation/algorand-typescript/arc4'
import type { DecoratedGreeter } from './decorated-greeter.algo'

export class Hello extends Contract {
  greeterApp = GlobalState<Application>({ key: 'greeterApp' })

  @abimethod({ onCreate: 'require' })
  createApplication(greeterApp: Application): void {
    this.greeterApp.value = greeterApp
  }

  greet(): string {
    abiCall<typeof DecoratedGreeter.prototype.setGreeting>({ appId: this.greeterApp.value, args: ['Hello'] })
    abiCall<typeof DecoratedGreeter.prototype.setName>({ appId: this.greeterApp.value, args: ['World'] })

    const { returnValue } = abiCall<typeof DecoratedGreeter.prototype.greet>({ appId: this.greeterApp.value, args: ['from Algorand'] })

    return returnValue
  }
}
