package com.partyvibe.service;

import com.partyvibe.dto.RoomSeatDto;
import com.partyvibe.dto.SeatActionRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.model.Room;
import com.partyvibe.model.RoomSeat;
import com.partyvibe.model.User;
import com.partyvibe.repository.RoomRepository;
import com.partyvibe.repository.RoomSeatRepository;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.websocket.RoomEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeatServiceTest {

    @Mock
    private RoomSeatRepository seatRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SafetyService safetyService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RoomEventPublisher eventPublisher;

    @InjectMocks
    private SeatService seatService;

    private User host;
    private User guest;
    private Room room;
    private RoomSeat seat1;
    private RoomSeat seat2;

    @BeforeEach
    void setUp() {
        host = User.builder().id(1L).username("host").build();
        guest = User.builder().id(2L).username("guest").build();
        room = Room.builder().id(10L).title("Test Room").owner(host).active(true).build();

        seat1 = RoomSeat.builder().id(101L).room(room).seatNo(1).user(host).locked(false).muted(false).build();
        seat2 = RoomSeat.builder().id(102L).room(room).seatNo(2).user(null).locked(false).muted(false).build();
    }

    @Test
    @DisplayName("takeSeat should assign empty seat to user and broadcast")
    void testTakeSeatSuccess() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(safetyService.isUserBannedFromRoom(10L, 2L)).thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(seatRepository.findByRoomIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        when(seatRepository.findByRoomIdAndSeatNoForUpdate(10L, 2)).thenReturn(Optional.of(seat2));
        when(seatRepository.findByRoomIdOrderBySeatNoAsc(10L)).thenReturn(List.of(seat1, seat2));

        List<RoomSeatDto> result = seatService.takeSeat(2L, 10L, 2);

        assertNotNull(result);
        assertEquals(guest, seat2.getUser());
        verify(seatRepository, times(1)).save(seat2);
        verify(eventPublisher, times(1)).broadcastToRoom(eq(10L), eq("SEATS_UPDATED"), any());
    }

    @Test
    @DisplayName("takeSeat on locked seat should throw BadRequestException")
    void testTakeSeatLocked() {
        seat2.setLocked(true);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(safetyService.isUserBannedFromRoom(10L, 2L)).thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(seatRepository.findByRoomIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        when(seatRepository.findByRoomIdAndSeatNoForUpdate(10L, 2)).thenReturn(Optional.of(seat2));

        assertThrows(BadRequestException.class, () -> seatService.takeSeat(2L, 10L, 2));
    }

    @Test
    @DisplayName("takeSeat on already occupied seat should throw BadRequestException")
    void testTakeSeatOccupied() {
        User anotherUser = User.builder().id(3L).username("charlie").build();
        seat2.setUser(anotherUser);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(safetyService.isUserBannedFromRoom(10L, 2L)).thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(seatRepository.findByRoomIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        when(seatRepository.findByRoomIdAndSeatNoForUpdate(10L, 2)).thenReturn(Optional.of(seat2));

        assertThrows(BadRequestException.class, () -> seatService.takeSeat(2L, 10L, 2));
    }

    @Test
    @DisplayName("Owner can lock and kick occupant from seat")
    void testOwnerLockSeat() {
        seat2.setUser(guest);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(seatRepository.findByRoomIdAndSeatNo(10L, 2)).thenReturn(Optional.of(seat2));
        when(seatRepository.findByRoomIdOrderBySeatNoAsc(10L)).thenReturn(List.of(seat1, seat2));

        SeatActionRequest req = SeatActionRequest.builder()
                .seatNo(2)
                .action(SeatActionRequest.SeatAction.LOCK)
                .build();

        seatService.performSeatAction(1L, 10L, req);

        assertTrue(seat2.isLocked());
        assertNull(seat2.getUser()); // Occupant evicted
        verify(seatRepository, times(1)).save(seat2);
        verify(eventPublisher, times(1)).broadcastToRoom(eq(10L), eq("SEATS_UPDATED"), any());
    }

    @Test
    @DisplayName("Non-owner cannot lock seat")
    void testNonOwnerLockSeatThrows() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        SeatActionRequest req = SeatActionRequest.builder()
                .seatNo(2)
                .action(SeatActionRequest.SeatAction.LOCK)
                .build();

        assertThrows(BadRequestException.class, () -> seatService.performSeatAction(2L, 10L, req));
    }
}
