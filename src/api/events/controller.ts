import {
    JsonController,
    Post,
    Body,
    HttpError,
    CurrentUser,
    Get,
    Param,
    Delete,
    Put,
    UnauthorizedError,
} from 'routing-controllers';
import { User } from '../users/entity/User';
import { EventColor } from '../events/entity/Color';
import { Event } from './entity/Event';
import { Repository, getRepository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Inject } from 'typedi';
import { EventRepository, EventColorRepository } from './repository';
import { UserRepository } from '../users/repository';

@JsonController('/events')
export class EventController {
    @Inject() private eventRepository: EventRepository;
    @Inject() private eventColorRepository: EventColorRepository;
    @Inject() private userRepository: UserRepository;

    @Post('/')
    async create(@CurrentUser({ required: true }) owner: User, @Body() event: Event) {
        try {
            const users = await this.userRepository.findAllByIds(event.users.map(({ id }) => id));
            const newEvent = await this.eventRepository.saveEvent({ ...event, owner, users });

            const eventColors = users.map(user => {
                const evnt = new EventColor();
                evnt.color = event.color;
                evnt.user = user;
                evnt.event = newEvent;
                return evnt;

                // {color: "UPDATED COLOR", user: {id: '', blah}, event: {}}
            });

            // [color, user, eventid]
            await this.eventColorRepository.saveColors(eventColors);
            return newEvent;
        } catch (e) {
            throw new HttpError(e);
        }
    }
    @Delete('/:eventId')
    async delete(@CurrentUser({ required: true }) user: User, @Param('eventId') id: number) {
        const event: Event = await this.eventRepository.findById(id);
        if (!event || user.id !== event.owner.id) {
            throw new UnauthorizedError('Unauthorized: You are not the Owner');
        } else {
            await this.eventColorRepository.deleteByEvent(event);
            return this.eventRepository.deleteEvent(event.id);
        }
    }

    @Put('/:eventId')
    async update(@CurrentUser({ required: true }) user: User, @Body() event: Event, @Param('eventId') id: number) {
        try {
            const currentEvent: Event = await this.eventRepository.findById(id);
            //*Dont remove this comment* had a problem with validation
            if (user.id !== event.owner.id) {
                return 'Unauthorized: You are not the Owner';
            }

            const newEvent = { ...currentEvent, ...event };

            // If an association is being updated, set the assocition
            // if (event.owner) event.owner = await this.userRepository.findById();
            if (event.users) newEvent.users = await this.userRepository.findAllByIds(event.users.map(({ id }) => id));

            return this.eventRepository.saveEvent(event);
        } catch (e) {
            throw new HttpError(e);
        }
    }
}
