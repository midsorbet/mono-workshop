import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entity/User';
import { Event } from './Event';

@Entity('EventRoster')
export class EventRoster {
    @ManyToOne(() => User, User => User.eventColors, { primary: true })
    user: User;

    @ManyToOne(() => Event, Event => Event.eventRoster, { primary: true })
    event: Event;

    @Column()
    color: string;
}
