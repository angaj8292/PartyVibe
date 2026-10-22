package com.partyvibe.service;

import com.partyvibe.dto.RoomSeatDto;
import com.partyvibe.dto.SeatActionRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.Room;
import com.partyvibe.model.RoomSeat;
import com.partyvibe.model.User;
import com.partyvibe.repository.RoomRepository;
import com.partyvibe.repository.RoomSeatRepository;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.websocket.RoomEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatService {

    private final RoomSeatRepository seatRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SafetyService safetyService;
    private final UserMapper userMapper;
    private final RoomEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<RoomSeatDto> getRoomSeats(Long roomId, Long currentUserId) {
        return seatRepository.findByRoomIdOrderBySeatNoAsc(roomId)
                .stream()
                .map(seat -> toDto(seat, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public List<RoomSeatDto> takeSeat(Long userId, Long roomId, int seatNo) {
        if (seatNo < 1 || seatNo > 8) {
            throw new BadRequestException("Invalid seat number. Must be between 1 and 8");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.isActive()) {
            throw new BadRequestException("Room is not active");
        }

        if (safetyService.isUserBannedFromRoom(roomId, userId)) {
            throw new BadRequestException("You are banned from this room");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If user is already on another seat in this room, free it first
        seatRepository.findByRoomIdAndUserId(roomId, userId).ifPresent(oldSeat -> {
            if (oldSeat.getSeatNo() != seatNo) {
                oldSeat.setUser(null);
                seatRepository.save(oldSeat);
                log.info("User {} left seat {} in room {}", userId, oldSeat.getSeatNo(), roomId);
            }
        });

        // Use pessimistic lock for seat assignment to prevent race conditions
        RoomSeat targetSeat = seatRepository.findByRoomIdAndSeatNoForUpdate(roomId, seatNo)
                .orElseThrow(() -> new ResourceNotFoundException("Seat " + seatNo + " not found"));

        if (targetSeat.isLocked()) {
            throw new BadRequestException("Seat " + seatNo + " is locked by the host");
        }

        if (targetSeat.getUser() != null && !targetSeat.getUser().getId().equals(userId)) {
            throw new BadRequestException("Seat " + seatNo + " is already occupied by " + targetSeat.getUser().getUsername());
        }

        targetSeat.setUser(user);
        seatRepository.save(targetSeat);
        log.info("User {} successfully took seat {} in room {}", user.getUsername(), seatNo, roomId);

        List<RoomSeatDto> seats = getRoomSeats(roomId, userId);
        // Broadcast updated seats to room
        eventPublisher.broadcastToRoom(roomId, "SEATS_UPDATED", seats);
        return seats;
    }

    @Transactional
    public List<RoomSeatDto> leaveSeat(Long userId, Long roomId) {
        RoomSeat seat = seatRepository.findByRoomIdAndUserId(roomId, userId).orElse(null);
        if (seat != null) {
            seat.setUser(null);
            seatRepository.save(seat);
            log.info("User {} left seat {} in room {}", userId, seat.getSeatNo(), roomId);
        }

        List<RoomSeatDto> seats = getRoomSeats(roomId, userId);
        eventPublisher.broadcastToRoom(roomId, "SEATS_UPDATED", seats);
        return seats;
    }

    @Transactional
    public List<RoomSeatDto> performSeatAction(Long operatorUserId, Long roomId, SeatActionRequest req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        boolean isOwner = room.getOwner().getId().equals(operatorUserId);

        switch (req.getAction()) {
            case TAKE -> {
                return takeSeat(operatorUserId, roomId, req.getSeatNo());
            }
            case LEAVE -> {
                return leaveSeat(operatorUserId, roomId);
            }
            case LOCK -> {
                if (!isOwner) throw new BadRequestException("Only room owner can lock seats");
                return setSeatLocked(roomId, req.getSeatNo(), true, operatorUserId);
            }
            case UNLOCK -> {
                if (!isOwner) throw new BadRequestException("Only room owner can unlock seats");
                return setSeatLocked(roomId, req.getSeatNo(), false, operatorUserId);
            }
            case MUTE -> {
                if (!isOwner) throw new BadRequestException("Only room owner can mute seats");
                return setSeatMuted(roomId, req.getSeatNo(), true, operatorUserId);
            }
            case UNMUTE -> {
                if (!isOwner) throw new BadRequestException("Only room owner can unmute seats");
                return setSeatMuted(roomId, req.getSeatNo(), false, operatorUserId);
            }
            case KICK -> {
                if (!isOwner) throw new BadRequestException("Only room owner can kick users from seats");
                return kickSeatOccupant(roomId, req.getSeatNo(), operatorUserId);
            }
            default -> throw new BadRequestException("Unsupported seat action: " + req.getAction());
        }
    }

    private List<RoomSeatDto> setSeatLocked(Long roomId, int seatNo, boolean locked, Long operatorId) {
        RoomSeat seat = seatRepository.findByRoomIdAndSeatNo(roomId, seatNo)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found"));
        seat.setLocked(locked);
        if (locked && seat.getUser() != null) {
            // Kick occupant if locking seat
            seat.setUser(null);
        }
        seatRepository.save(seat);

        List<RoomSeatDto> seats = getRoomSeats(roomId, operatorId);
        eventPublisher.broadcastToRoom(roomId, "SEATS_UPDATED", seats);
        return seats;
    }

    private List<RoomSeatDto> setSeatMuted(Long roomId, int seatNo, boolean muted, Long operatorId) {
        RoomSeat seat = seatRepository.findByRoomIdAndSeatNo(roomId, seatNo)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found"));
        seat.setMuted(muted);
        seatRepository.save(seat);

        List<RoomSeatDto> seats = getRoomSeats(roomId, operatorId);
        eventPublisher.broadcastToRoom(roomId, "SEATS_UPDATED", seats);
        return seats;
    }

    private List<RoomSeatDto> kickSeatOccupant(Long roomId, int seatNo, Long operatorId) {
        RoomSeat seat = seatRepository.findByRoomIdAndSeatNo(roomId, seatNo)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found"));
        seat.setUser(null);
        seatRepository.save(seat);

        List<RoomSeatDto> seats = getRoomSeats(roomId, operatorId);
        eventPublisher.broadcastToRoom(roomId, "SEATS_UPDATED", seats);
        return seats;
    }

    @Transactional(readOnly = true)
    public boolean isUserOnSeat(Long roomId, Long userId) {
        return seatRepository.findByRoomIdAndUserId(roomId, userId).isPresent();
    }

    public RoomSeatDto toDto(RoomSeat seat, Long currentUserId) {
        UserSummaryDto userSummary = seat.getUser() != null
                ? userMapper.toSummaryDto(seat.getUser(), currentUserId)
                : null;

        return RoomSeatDto.builder()
                .id(seat.getId())
                .seatNo(seat.getSeatNo())
                .user(userSummary)
                .locked(seat.isLocked())
                .muted(seat.isMuted())
                .build();
    }
}
