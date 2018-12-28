import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import { IRootState } from "reducers";
import { IProfilesState } from "reducers/profilesReducer";

import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from 'components/Account/OAuthLogin';

import * as css from "./ViewDao.scss";
import { arc } from 'arc'
import { DAO, Member, IDAOState, IMemberState } from '@daostack/client'
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

interface IProps extends RouteComponentProps<any> {
  dao: IDAOState
  members: Member[]
  profiles: IProfilesState
}

// TODO: can i make this not a container and just take the dao passed in as a prop?
const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: ownProps.dao,
    members: ownProps.members,
    profiles: state.profiles
  }
}

class DaoMembersContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, members, profiles } = this.props;

    const membersHTML = members.map((member) => {
      <Subscribe observable={member.state}>{(state: IObservableState<IMemberState>) => {
        if (state.error) {
          return <div>{state.error.message}</div>
        } else if (state.data) {
          const memberState = state.data
          const profile = profiles[memberState.address];
          return (
            <div className={css.member + " " + css.clearfix} key={"member_" + memberState.address}>
              <AccountImage
                accountAddress={memberState.address}
                className="membersPage"
              />
              <div className={css.memberAddress}>
                { profile ?
                  <div>
                    <AccountProfileName accountProfile={profile} daoAvatarAddress={dao.address} />
                    {Object.keys(profile.socialURLs).length == 0 ? "" :
                      <span>
                        <OAuthLogin editing={false} provider='facebook' accountAddress={memberState.address} profile={profile} className={css.socialButton}/>
                        <OAuthLogin editing={false} provider='twitter' accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                        <OAuthLogin editing={false} provider='github' accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                      </span>
                    }
                    <br/>
                  </div>
                  : ""
                }
                <div>{memberState.address}</div>
              </div>
              {
              // TODO: get reptuation of member (probably best wrapping this whole component in a separate container thatSubscribes to member.stat)
              // Reputation: <span>{member.reputation.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
              //   ({(100 * member.reputation / dao.reputationTotalSupply).toFixed(1)}%)</span>
              }
              <div>Reputation: <span>{state.data.reputation}</span></div>
            </div>
          );
        } else {
          return <div>...loading..</div>
        }
      }}</Subscribe>
    });

    return (
      <div className={css.membersContainer}>
        {membersHTML}
      </div>
    );
  }

}

const ConnectedDaoMembersContainer = connect(mapStateToProps)(DaoMembersContainer);

export default (props: { dao: IDAOState } & RouteComponentProps<any>) => {
  const daoAddress = props.match.params.daoAvatarAddress
  if (daoAddress) {
      const dao = new DAO(daoAddress, arc)
      return <Subscribe observable={dao.members()}>{(state: IObservableState<Member[]>) => {
          if (state.error) {
            return <div>{ state.error.message }</div>
          } else if (state.data) {
            return <ConnectedDaoMembersContainer members={state.data} />
          } else {
            return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
          }
        }
      }</Subscribe>
  } else {
    throw Error(`No dao address specified `)
  }
}
