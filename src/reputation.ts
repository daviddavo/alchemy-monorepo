import { ApolloQueryResult } from 'apollo-client'
import gql from 'graphql-tag'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Arc } from './arc'
import { Address, IStateful } from './types'

export interface IReputationState {
  address: Address
  totalSupply: number
}

export class Reputation implements IStateful<IReputationState> {

  public state: Observable<IReputationState>

  constructor(public address: Address, public context: Arc) {
    const query = gql`{
      reputationContract (id: "${address.toLowerCase()}") {
        id,
        address,
        totalSupply
      }
    }`
    const itemMap = (item: any): IReputationState => {
      if (item === null) {
        throw Error(`Could not find a reputation contract with address ${address.toLowerCase()}`)
      }
      return {
        address: item.address,
        totalSupply: item.totalSupply
      }
    }
    this.state = context._getObservableObject(query, itemMap) as Observable<IReputationState>
  }

  public reputationOf(address: Address): Observable<number> {
    const query = gql`{
      reputationHolders (
        where: { address:"${address}",
        contract: "${this.address}"}
      )
      {
        id, address, balance,contract
      }
    }`
    return this.context.getObservable(query).pipe(
      map((r: ApolloQueryResult<any>) => r.data.reputationHolders),
      map((items: any[]) => {
        const item = items.length > 0 && items[0]
        return item.balance !== undefined ? Number(item.balance) : 0
      })
    )
  }
}
