import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';
import { Helmet } from 'react-helmet';

import { List as ImmutableList } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';

import ChevronRightIcon from '@/material-icons/400-24px/chevron_right.svg?react';
import ExpandMoreIcon from '@/material-icons/400-24px/expand_more.svg?react';
import { fetchServer, fetchExtendedDescription, fetchDomainBlocks  } from 'flavours/glitch/actions/server';
import Column from 'flavours/glitch/components/column';
import { Icon  }  from 'flavours/glitch/components/icon';
import { ServerHeroImage } from 'flavours/glitch/components/server_hero_image';
import { Skeleton } from 'flavours/glitch/components/skeleton';
import Account from 'flavours/glitch/containers/account_container';
import LinkFooter from 'flavours/glitch/features/ui/components/link_footer';

const messages = defineMessages({
  title: { id: 'column.about', defaultMessage: 'About' },
  rules: { id: 'about.rules', defaultMessage: 'Server rules' },
  blocks: { id: 'about.blocks', defaultMessage: 'Moderated servers' },
  silenced: { id: 'about.domain_blocks.silenced.title', defaultMessage: 'Limited' },
  silencedExplanation: { id: 'about.domain_blocks.silenced.explanation', defaultMessage: 'You will generally not see profiles and content from this server, unless you explicitly look it up or opt into it by following.' },
  suspended: { id: 'about.domain_blocks.suspended.title', defaultMessage: 'Suspended' },
  suspendedExplanation: { id: 'about.domain_blocks.suspended.explanation', defaultMessage: 'No data from this server will be processed, stored or exchanged, making any interaction or communication with users from this server impossible.' },
});

const severityMessages = {
  silence: {
    title: messages.silenced,
    explanation: messages.silencedExplanation,
  },

  suspend: {
    title: messages.suspended,
    explanation: messages.suspendedExplanation,
  },
};

const mapStateToProps = state => ({
  server: state.getIn(['server', 'server']),
  extendedDescription: state.getIn(['server', 'extendedDescription']),
  domainBlocks: state.getIn(['server', 'domainBlocks']),
});

class Section extends PureComponent {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    open: PropTypes.bool,
    onOpen: PropTypes.func,
  };

  state = {
    collapsed: !this.props.open,
  };

  handleClick = () => {
    const { onOpen } = this.props;
    const { collapsed } = this.state;

    this.setState({ collapsed: !collapsed }, () => onOpen && onOpen());
  };

  render () {
    const { title, children } = this.props;
    const { collapsed } = this.state;

    return (
      <div className={classNames('about__section', { active: !collapsed })}>
        <div className='about__section__title' role='button' tabIndex={0} onClick={this.handleClick}>
          <Icon id={collapsed ? 'chevron-right' : 'chevron-down'} icon={collapsed ? ChevronRightIcon : ExpandMoreIcon} /> {title}
        </div>

        {!collapsed && (
          <div className='about__section__body'>{children}</div>
        )}
      </div>
    );
  }

}

class About extends PureComponent {

  static propTypes = {
    server: ImmutablePropTypes.map,
    extendedDescription: ImmutablePropTypes.map,
    domainBlocks: ImmutablePropTypes.contains({
      isLoading: PropTypes.bool,
      isAvailable: PropTypes.bool,
      items: ImmutablePropTypes.list,
    }),
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    multiColumn: PropTypes.bool,
  };

  componentDidMount () {
    const { dispatch } = this.props;
    dispatch(fetchServer());
    dispatch(fetchExtendedDescription());
  }

  handleDomainBlocksOpen = () => {
    const { dispatch } = this.props;
    dispatch(fetchDomainBlocks());
  };

  render () {
    const { multiColumn, intl, server, extendedDescription, domainBlocks } = this.props;
    const isLoading = server.get('isLoading');

    return (
      <Column bindToDocument={!multiColumn} label={intl.formatMessage(messages.title)}>
        <div className='scrollable about'>
          <div className='about__header'>
            <ServerHeroImage blurhash={server.getIn(['thumbnail', 'blurhash'])} src={server.getIn(['thumbnail', 'url'])} srcSet={server.getIn(['thumbnail', 'versions'])?.map((value, key) => `${value} ${key.replace('@', '')}`).join(', ')} className='about__header__hero' />
            {extendedDescription.get('isLoading') ? <Skeleton width='100%' /> : <div className='prose' dangerouslySetInnerHTML={{ __html: extendedDescription.get('content') }} />}
          </div>

          <div className='about__meta'>
            <div className='about__meta__column'>
              <h4><FormattedMessage id='server_banner.administered_by' defaultMessage='Administered by:' /></h4>

              <Account id={server.getIn(['contact', 'account', 'id'])} size={36} minimal />
            </div>

            <hr className='about__meta__divider' />

            <div className='about__meta__column'>
              <h4><FormattedMessage id='about.contact' defaultMessage='Contact:' /></h4>

              {isLoading ? <Skeleton width='10ch' /> : <a className='about__mail' href={`mailto:${server.getIn(['contact', 'email'])}`}>{server.getIn(['contact', 'email'])}</a>}
            </div>
          </div>

          <Section title={intl.formatMessage(messages.rules)}>
            {!isLoading && (server.get('rules', ImmutableList()).isEmpty() ? (
              <p><FormattedMessage id='about.not_available' defaultMessage='This information has not been made available on this server.' /></p>
            ) : (
              <ol className='rules-list'>
                {server.get('rules').map(rule => (
                  <li key={rule.get('id')}>
                    <span className='rules-list__text'>{rule.get('text')}</span>
                  </li>
                ))}
              </ol>
            ))}
          </Section>

          <Section title='Moderation'>
            <p>
              If you notice that a member of hex.st is behaving in a way that
              violates either the core values or rules, or see content from
              another instance that goes against them, please let the moderators
              know either via the reporting system (click the "..." on a post
              and use the "Report..." option) or the admin email address listed
              above the rules. In particular, to flag issues with other
              instances, you can also simply tag @admin.
            </p>
            <p>
              Moderators will respond to these reports and/or take precautionary
              actions at their sole discretion, in the manner they deem
              appropriate, up to and including expulsion from hex.st and
              disclosing of the incident to other hex.st members or the general
              public. However, the identities of any victims will never be made
              public without their affirmative consent.
            </p>
            <p>
              Such moderation actions can also be taken based on an individual's
              past behavior, behavior outside hex.st and behavior towards people
              who are not members of hex.st.
            </p>
            <p>
              The moderation philosophy on hex.st is that while people are
              capable of positive change and rehabilitation should be
              encouraged, the safety and well-being of victims and other members
              of hex.st will always be prioritized.
            </p>
          </Section>

          <Section
            title={intl.formatMessage(messages.blocks)}
            onOpen={this.handleDomainBlocksOpen}
          >
            {domainBlocks.get('isLoading') ? (
              <>
                <Skeleton width='100%' />
                <br />
                <Skeleton width='70%' />
              </>
            ) : (domainBlocks.get('isAvailable') ? (
              <>
                <p>
                  Mastodon allows you to view content from any other server in the fediverse; however, in doing so, you potentially expose all users from <i>your</i> server to that same content. Therefore, to protect members on hex.st, limits have been put in place to prevent communication with servers known to host hateful and harmful messages.
                </p>
                <p>
                  Additionally, some servers have specific goals and rules that make them prone to generating <li>lots</li> of posts – for example, from generative bots. While for the most part there is nothing wrong with this, such servers will still be marked as "limited", so that the content they host doesn't inundate the timelines of members who don't explicitly seek it out.
                </p>
                <p>
                  Finally, as a general rule hex.st will limit communication with a server if it's apparent that its existence is motivated more by the profit of its creators than by the well-being of its users, and of the fediverse at large. This notably includes Threads, the server run by Meta: their past decisions demonstrate a pattern of prioritizing their business above their users' safety and privacy.
                </p>

                {domainBlocks.get('items').size > 0 && (
                  <div className='about__domain-blocks'>
                    {domainBlocks.get('items').map(block => (
                      <div className='about__domain-blocks__domain' key={block.get('domain')}>
                        <div className='about__domain-blocks__domain__header'>
                          <h6><span title={`SHA-256: ${block.get('digest')}`}>{block.get('domain')}</span></h6>
                          <span className='about__domain-blocks__domain__type' title={intl.formatMessage(severityMessages[block.get('severity')].explanation)}>{intl.formatMessage(severityMessages[block.get('severity')].title)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p><FormattedMessage id='about.not_available' defaultMessage='This information has not been made available on this server.' /></p>
            ))}
          </Section>

          <Section title='Acknowledgments'>
            <p>
              hex.st runs on{' '}
              <a href='https://github.com/glitch-soc/mastodon'>Glitch-soc</a>, a
              fork of{' '}
              <a href='https://github.com/mastodon/mastodon'>Mastodon</a>.
              Glitch-soc and Mastodon are free open source software. Mastodon is
              a trademark of Mastodon gGmbH.
            </p>
            <p>
              The typefaces used across hex.st are{' '}
              <a href='https://github.com/kosbarts/Commissioner'>
                Commissionner
              </a>
              , <a href='https://github.com/googlefonts/dm-mono'>DM Mono</a> and{' '}
              <a href='https://github.com/sebsan/Bagnard'>Bagnard</a>, all
              subject to the{' '}
              <a href='http://scripts.sil.org/OFL'>SIL Open Font License 1.1</a>
              .
            </p>
            <p>
              Some of the language used in this page was adapted from{' '}
              <a href='https://friend.camp/about/more'>Friend Camp's</a> and{' '}
              <a href='https://bonfirenetworks.org/conduct/'>Bonfire's</a> codes
              of conduct.
            </p>
            <p>
              Finally, the administrator of hex.st acknowledges that he lives on
              unceded Indigenous land and recognizes the Kanien’kehá:ka Nation
              as the custodians of this land.
            </p>
          </Section>

          <LinkFooter />
        </div>

        <Helmet>
          <title>{intl.formatMessage(messages.title)}</title>
          <meta name='robots' content='all' />
        </Helmet>
      </Column>
    );
  }

}

export default connect(mapStateToProps)(injectIntl(About));
