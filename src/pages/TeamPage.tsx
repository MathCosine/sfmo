import { useState } from 'react';
import { Portrait } from '../components/Portrait';
import { SeoHead } from '../components/SeoHead';
import { boardMembers, contributors, type StaffMember } from '../data/staff';
import { links } from '../lib/config';

function StaffCard({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`crew ${open ? 'crew--open' : ''}`}>
      <div className="crew__photo">
        <Portrait
          slug={member.slug}
          name={member.name}
          position={member.photoPosition}
          contain={member.photoContain}
        />
        <span className="crew__title pixel">{member.boardTitle}</span>
      </div>

      <div className="crew__body">
        <h3 className="crew__name">{member.name}</h3>
        <div className="tag-row">
          {member.roles.map((role) => (
            <span className="tag" key={role}>
              {role}
            </span>
          ))}
        </div>

        <p className="crew__bio" id={`bio-${member.slug}`} hidden={!open}>
          {member.bio}
        </p>

        <button
          type="button"
          className="crew__toggle"
          aria-expanded={open}
          aria-controls={`bio-${member.slug}`}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '— Hide bio' : '+ Read bio'}
        </button>
      </div>
    </article>
  );
}

export function TeamPage() {
  return (
    <>
      <SeoHead
        title="Team — San Francisco Math Initiative"
        description="The organizers, problem writers, and volunteers behind the San Francisco Math Initiative."
      />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Who we are</p>
          <h1>The Crew</h1>
          <p className="lede">
            The people behind the competitions, the curriculum, and the community. Every one of them
            is a student who writes contests in the time other people spend sleeping.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Board members</p>
            <h2>Running the ship</h2>
          </div>
          <div className="crew-grid">
            {boardMembers.map((member) => (
              <StaffCard member={member} key={member.slug} />
            ))}
          </div>
        </div>
      </section>

      {contributors.length > 0 && (
        <section className="section section--tight">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Contributors</p>
              <h2>Problem writers & volunteers</h2>
            </div>
            <div className="crew-grid">
              {contributors.map((member) => (
                <StaffCard member={member} key={member.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="wrap">
          <div className="panel join-panel">
            <div>
              <p className="eyebrow">Join us</p>
              <h2>Want to help write SFMO 2027?</h2>
              <p className="lede">
                We are always looking for problem writers, graders, and volunteers — but be warned
                that the application is rigorous. Expect a demanding written screening: original
                problems of your own, full solutions, and a review of your mathematical taste as
                much as your ability. We keep the bar high because the problem sets depend on it.
              </p>
              <p className="lede">
                If that sounds like your kind of thing, start a conversation in the Discord or send
                us an email and we will tell you what the current round involves.
              </p>
            </div>
            <div className="btn-row">
              <a href={links.discord} target="_blank" rel="noreferrer" className="btn btn--deep btn--lg">
                Join the Discord
              </a>
              <a href={`mailto:${links.email}`} className="btn btn--lg">
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
